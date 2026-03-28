using System.Linq;
using System.Text.Json;
using Chimera.API.Core.Settings;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Chimera.API.Synapse.Infrastructure.Messaging;

/// <summary>
/// Consumes <see cref="ChatMessage"/> events from the Synapse ingest Redis stream and runs event-driven aggregation
/// (channel context → parallel Session/RAG/Context shards → JSON fan-in).
/// </summary>
public sealed class ChatMessageStreamConsumer : BackgroundService
{
    #region Fields

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConnectionMultiplexer _redis;
    private readonly SynapseIngestStreamSettings _settings;
    private readonly ILogger<ChatMessageStreamConsumer> _logger;
    private readonly string _consumerName;

    #endregion

    #region Constructors

    public ChatMessageStreamConsumer(
        IServiceScopeFactory scopeFactory,
        IConnectionMultiplexer redis,
        IOptions<SynapseIngestStreamSettings> settings,
        ILogger<ChatMessageStreamConsumer> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        var instanceId = SynapseIngestStreamSettings.ResolveConsumerInstanceId();
        _consumerName = _settings.FormatConsumerName(instanceId);
    }

    #endregion

    #region Protected Methods

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await WaitForRedisAvailableAsync(stoppingToken);

            var db = _redis.GetDatabase();
            await EnsureConsumerGroupExistsAsync(db, stoppingToken);

            _logger.LogInformation(
                "ChatMessageStreamConsumer started. Stream={Stream} Group={Group} Consumer={Consumer}",
                _settings.StreamName, _settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));

            _logger.LogInformation("ChatMessageStreamConsumer stopped.");
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("ChatMessageStreamConsumer cancelled.");
        }
    }

    #endregion

    #region Private Methods

    /// <summary>
    /// Blocks until Redis accepts a command, with backoff. Avoids crashing the host when Redis is down at startup.
    /// </summary>
    private async Task WaitForRedisAvailableAsync(CancellationToken ct)
    {
        var delay = TimeSpan.FromSeconds(1);
        var maxDelay = TimeSpan.FromSeconds(30);
        var attempt = 0;
        DateTimeOffset lastWarningUtc = default;
        var warnedOnce = false;

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.PingAsync();

                if (attempt > 0)
                {
                    _logger.LogInformation(
                        "Redis is reachable again. Synapse ingest consumer resuming. Endpoints: {Endpoints}",
                        FormatRedisEndpoints());
                }

                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (RedisException ex) when (IsLikelyConnectionOrBacklogIssue(ex))
            {
                attempt++;
                var now = DateTimeOffset.UtcNow;
                var shouldLog =
                    !warnedOnce
                    || (now - lastWarningUtc).TotalSeconds >= 30;

                if (shouldLog)
                {
                    lastWarningUtc = now;
                    warnedOnce = true;
                    _logger.LogWarning(
                        "Synapse ingest: Redis is not reachable yet ({Reason}). Endpoints: {Endpoints}. " +
                        "Start Redis or fix RedisSettings; retrying with backoff (next wait ~{Delay}s).",
                        GetRedisErrorSummary(ex),
                        FormatRedisEndpoints(),
                        Math.Round(delay.TotalSeconds, 1));
                }

                await Task.Delay(delay, ct);
                delay = TimeSpan.FromMilliseconds(
                    Math.Min(delay.TotalMilliseconds * 1.5, maxDelay.TotalMilliseconds));
            }
        }
    }

    private async Task EnsureConsumerGroupExistsAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    _settings.StreamName,
                    _settings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true,
                    flags: CommandFlags.None);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Consumer group already exists: {Group}", _settings.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (RedisException ex) when (IsLikelyConnectionOrBacklogIssue(ex))
            {
                _logger.LogWarning(
                    "Synapse ingest: could not create consumer group yet ({Reason}). Waiting for Redis...",
                    GetRedisErrorSummary(ex));
                await WaitForRedisAvailableAsync(ct);
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
                    noAck: false,
                    flags: CommandFlags.None);

                if (entries.Length == 0)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(_settings.ReadBlockMilliseconds), ct);
                    continue;
                }

                foreach (var entry in entries)
                {
                    await ProcessEntryAsync(db, entry, ct);
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex) when (IsLikelyConnectionOrBacklogIssue(ex))
            {
                _logger.LogWarning(
                    "Synapse ingest: Redis read interrupted ({Reason}). Reconnecting...",
                    GetRedisErrorSummary(ex));
                await WaitForRedisAvailableAsync(ct);
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
                    count: _settings.AutoClaimBatchSize,
                    flags: CommandFlags.None);

                if (result.IsNull)
                {
                    cursor = "0-0";
                    continue;
                }

                // Advance cursor; "0-0" means the scan wrapped around — reset for next full pass
                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                {
                    await ProcessEntryAsync(db, entry, ct);
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex) when (IsLikelyConnectionOrBacklogIssue(ex))
            {
                _logger.LogWarning(
                    "Synapse ingest: XAUTOCLAIM interrupted ({Reason}). Reconnecting...",
                    GetRedisErrorSummary(ex));
                await WaitForRedisAvailableAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "XAUTOCLAIM iteration failed");
            }
        }
    }

    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = TryGetPayload(entry);
        if (payloadJson is null)
        {
            _logger.LogWarning(
                "Stream entry {Id} missing payload field {Field}", entry.Id, _settings.PayloadFieldName);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        var message = JsonSerializer.Deserialize<ChatMessage>(payloadJson, JsonOptions);
        if (message is null)
        {
            _logger.LogWarning("Poison message, cannot deserialize. Id={Id}", entry.Id);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        try
        {
            _logger.LogDebug(
                "Processing message from {User} in {Channel}",
                message.Sender.UserName, message.ChannelName);

            using var scope = _scopeFactory.CreateScope();
            var orchestrator = scope.ServiceProvider.GetRequiredService<ISynapseIngestOrchestrator>();
            var context = new MessageProcessingContext
            {
                Message = message,
                TransportMessageId = entry.Id.ToString()!,
                CorrelationId = entry.Id.ToString()!
            };
            await orchestrator.ProcessAsync(context, ct);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Error while processing stream entry. Id={Id}", entry.Id);
        }
    }

    private string? TryGetPayload(StreamEntry entry)
    {
        foreach (var v in entry.Values)
        {
            if (v.Name.ToString() == _settings.PayloadFieldName)
            {
                return v.Value.ToString();
            }
        }

        return null;
    }

    private string FormatRedisEndpoints()
    {
        try
        {
            return string.Join(", ", _redis.GetEndPoints().Select(e => e.ToString()));
        }
        catch
        {
            return "(unknown)";
        }
    }

    private static string GetRedisErrorSummary(Exception ex)
    {
        var inner = ex;
        while (inner.InnerException is not null)
        {
            inner = inner.InnerException;
        }

        return $"{inner.GetType().Name}: {inner.Message}";
    }

    /// <summary>Transient client/transport failures we should wait out, not treat as pipeline bugs.</summary>
    private static bool IsLikelyConnectionOrBacklogIssue(RedisException ex)
    {
        for (var e = (Exception?)ex; e is not null; e = e.InnerException)
        {
            if (e is RedisConnectionException or RedisTimeoutException)
            {
                return true;
            }
        }

        var msg = ex.Message;
        return msg.Contains("no connection became available", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("UnableToConnect", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("It was not possible to connect", StringComparison.OrdinalIgnoreCase);
    }

    #endregion
}
