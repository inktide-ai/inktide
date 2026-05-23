using Inktide.API.Core.Generators;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Realtime.Infrastructure.Messaging;

/// <summary>
/// Consumes LLM text chunks from <c>synapse.llm.response</c> and pushes them to browser
/// clients as <c>textChunk</c> SignalR events via <see cref="AudioHub"/>.
///
/// <para>Runs a separate consumer group (<c>text-delivery-workers</c>) on the same Redis stream
/// that the TTS pipeline also reads — Redis Streams fan-out per group, so the two pipelines
/// are fully independent.</para>
///
/// <para>Delivery guarantee: at-least-once (ACK after SendAsync). Duplicate chunks are
/// idempotent on the frontend via <c>sequenceNumber</c> dedup.</para>
/// </summary>
public sealed class BrowserTextPublisher : BackgroundService
{

    private sealed record LlmChunkPayload(
        [property: JsonPropertyName("correlationId")]   string CorrelationId,
        [property: JsonPropertyName("channelId")]       string ChannelId,
        [property: JsonPropertyName("text")]            string Text,
        [property: JsonPropertyName("sequenceNumber")]  int    SequenceNumber,
        [property: JsonPropertyName("isLast")]          bool   IsLast);


    private readonly IConnectionMultiplexer _redis;
    private readonly IHubContext<AudioHub>  _hub;
    private readonly RealtimeTextStreamSettings _settings;
    private readonly ILogger<BrowserTextPublisher> _logger;
    private readonly string _consumerName;


    public BrowserTextPublisher(
        IConnectionMultiplexer redis,
        IHubContext<AudioHub>  hub,
        IOptions<RealtimeTextStreamSettings> settings,
        ILogger<BrowserTextPublisher> logger)
    {
        _redis    = redis    ?? throw new ArgumentNullException(nameof(redis));
        _hub      = hub      ?? throw new ArgumentNullException(nameof(hub));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));

        _consumerName = $"{_settings.ConsumerNamePrefix}-{ResolveInstanceId()}";
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            _logger.LogInformation(
                "BrowserTextPublisher started. Stream={Stream} Group={Group} Consumer={Consumer}",
                _settings.StreamName, _settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }

        _logger.LogInformation("BrowserTextPublisher stopped.");
    }


    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    _settings.StreamName,
                    _settings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Consumer group already exists: {Group}", _settings.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create consumer group, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }


    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    _settings.StreamName,
                    _settings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: _settings.ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(_settings.ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Stream read error, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_settings.AutoClaimLoopDelaySeconds), ct);

            try
            {
                var result = await db.StreamAutoClaimAsync(
                    _settings.StreamName,
                    _settings.ConsumerGroup,
                    _consumerName,
                    minIdleTimeInMs: _settings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: _settings.AutoClaimBatchSize);

                if (result.IsNull) { cursor = "0-0"; continue; }

                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "XAUTOCLAIM iteration failed");
                cursor = "0-0";
            }
        }
    }


    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = ReadField(entry, _settings.PayloadFieldName);

        if (payloadJson is null)
        {
            _logger.LogWarning("Entry {Id} has no payload field — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        LlmChunkPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<LlmChunkPayload>(payloadJson);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Malformed LLM chunk payload. Id={Id} — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        if (payload is null || string.IsNullOrEmpty(payload.ChannelId))
        {
            _logger.LogWarning("LLM chunk payload {Id} is missing required fields — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        try
        {
            await PushToClientsAsync(payload, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to push textChunk to SignalR. Correlation={Correlation}",
                payload.CorrelationId);
        }
        finally
        {
            // ACK after SendAsync — at-least-once delivery.
            // Frontend deduplicates via sequenceNumber.
            await AckAsync(db, entry.Id);
        }
    }

    private async Task PushToClientsAsync(LlmChunkPayload payload, CancellationToken ct)
    {
        var group = AudioHub.GroupKey(payload.ChannelId);

        await _hub.Clients.Group(group).SendAsync(
            "textChunk",
            new
            {
                correlationId  = payload.CorrelationId,
                text           = payload.Text,
                sequenceNumber = payload.SequenceNumber,
                isLast         = payload.IsLast,
            },
            ct);

        _logger.LogDebug(
            "textChunk pushed. Channel={Channel} Seq={Seq} IsLast={IsLast} Correlation={Correlation}",
            payload.ChannelId, payload.SequenceNumber, payload.IsLast, payload.CorrelationId);
    }


    private Task AckAsync(IDatabase db, RedisValue entryId)
        => db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entryId);

    private static string? ReadField(StreamEntry entry, string field)
    {
        foreach (var v in entry.Values)
            if (v.Name.ToString() == field) return v.Value.ToString();
        return null;
    }

    private static string ResolveInstanceId()
        => Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
           ?? Environment.GetEnvironmentVariable("HOSTNAME")
           ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
           ?? IdGenerator.New().ToString("N")[..8];

}
