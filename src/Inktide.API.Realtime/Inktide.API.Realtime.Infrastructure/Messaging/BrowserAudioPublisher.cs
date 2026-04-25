using System.Text.Json;
using System.Text.Json.Serialization;
#pragma warning disable CA1869 // cached JsonElement is read-only pass-through
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Realtime.Infrastructure.Messaging;

/// <summary>
/// Consumes synthesized audio payloads from <c>synapse.tts.ready</c> and pushes them
/// to browser clients subscribed to the relevant channel via <see cref="AudioHub"/>.
/// </summary>
public sealed class BrowserAudioPublisher : BackgroundService
{

    private sealed record TtsReadyPayload(
        [property: JsonPropertyName("correlationId")]   string        CorrelationId,
        [property: JsonPropertyName("channelId")]       string        ChannelId,
        [property: JsonPropertyName("platformId")]      string        PlatformId,
        [property: JsonPropertyName("audioBase64")]     string        AudioBase64,
        [property: JsonPropertyName("contentType")]     string        ContentType,
        [property: JsonPropertyName("llmModel")]        string        LlmModel,
        /// <summary>
        /// Rhubarb viseme timeline, or <c>null</c> when Rhubarb is unavailable.
        /// Passed through opaquely as a raw JSON element — no Realtime-layer parsing needed.
        /// </summary>
        [property: JsonPropertyName("visemeTimeline")]  JsonElement?  VisemeTimeline,
        [property: JsonPropertyName("emotionId")]        string?       EmotionId        = null,
        [property: JsonPropertyName("emotionIntensity")] float         EmotionIntensity = 0f);


    private readonly IConnectionMultiplexer _redis;
    private readonly IHubContext<AudioHub> _hub;
    private readonly RealtimeStreamSettings _settings;
    private readonly ILogger<BrowserAudioPublisher> _logger;
    private readonly string _consumerName;


    public BrowserAudioPublisher(
        IConnectionMultiplexer redis,
        IHubContext<AudioHub> hub,
        IOptions<RealtimeStreamSettings> settings,
        ILogger<BrowserAudioPublisher> logger)
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
                "BrowserAudioPublisher started. Stream={Stream} Group={Group} Consumer={Consumer}",
                _settings.StreamName, _settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }

        _logger.LogInformation("BrowserAudioPublisher stopped.");
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

        TtsReadyPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<TtsReadyPayload>(payloadJson);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Malformed TTS payload. Id={Id} — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        if (payload is null || string.IsNullOrWhiteSpace(payload.AudioBase64))
        {
            _logger.LogWarning("TTS payload {Id} has no audio — discarding", entry.Id);
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
                "Failed to push audio to SignalR. Correlation={Correlation}",
                payload.CorrelationId);
        }
        finally
        {
            await AckAsync(db, entry.Id);
        }
    }

    private async Task PushToClientsAsync(TtsReadyPayload payload, CancellationToken ct)
    {
        var group = AudioHub.GroupKey(payload.ChannelId);

        await _hub.Clients.Group(group).SendAsync(
            "audioReceived",
            new
            {
                correlationId    = payload.CorrelationId,
                audioBase64      = payload.AudioBase64,
                contentType      = payload.ContentType,
                visemeTimeline   = payload.VisemeTimeline,  // null → frontend uses formant fallback
                emotion          = payload.EmotionId,
                emotionIntensity = payload.EmotionIntensity,
            },
            ct);

        _logger.LogDebug(
            "Audio pushed to SignalR. Channel={Channel} Correlation={Correlation}",
            payload.ChannelId, payload.CorrelationId);
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
           ?? Guid.NewGuid().ToString("N")[..8];

}
