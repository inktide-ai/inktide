using Inktide.API.Core.Generators;
using System.Diagnostics;
using System.Text.Json;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.ScreenAwareness.Application.Settings;
using Inktide.API.ScreenAwareness.Infrastructure.Telemetry;
using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.ScreenAwareness.Infrastructure.Workers;

public sealed class ScreenVisionWorker : BackgroundService
{

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IConnectionMultiplexer _redis;
    private readonly IVisionModelClient _vision;
    private readonly IScreenEventExtractor _extractor;
    private readonly IScreenContextRepository _contextRepo;
    private readonly IVisionUsageRecorder _usageRecorder;
    private readonly ScreenAwarenessMetrics _metrics;
    private readonly ScreenAwarenessSettings _settings;
    private readonly ScreenFrameStreamSettings _streamSettings;
    private readonly ILogger<ScreenVisionWorker> _logger;
    private readonly string _consumerName;

    public ScreenVisionWorker(
        IConnectionMultiplexer redis,
        IVisionModelClient vision,
        IScreenEventExtractor extractor,
        IScreenContextRepository contextRepo,
        IVisionUsageRecorder usageRecorder,
        ScreenAwarenessMetrics metrics,
        IOptions<ScreenAwarenessSettings> settings,
        IOptions<ScreenFrameStreamSettings> streamSettings,
        ILogger<ScreenVisionWorker> logger)
    {
        _redis          = redis          ?? throw new ArgumentNullException(nameof(redis));
        _vision         = vision         ?? throw new ArgumentNullException(nameof(vision));
        _extractor      = extractor      ?? throw new ArgumentNullException(nameof(extractor));
        _contextRepo    = contextRepo    ?? throw new ArgumentNullException(nameof(contextRepo));
        _usageRecorder  = usageRecorder  ?? throw new ArgumentNullException(nameof(usageRecorder));
        _metrics        = metrics        ?? throw new ArgumentNullException(nameof(metrics));
        _settings       = settings.Value;
        _streamSettings = streamSettings.Value;
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));

        _consumerName = $"{_streamSettings.ConsumerNamePrefix}-{Environment.MachineName}-{Environment.ProcessId}";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await WaitForRedisAvailableAsync(stoppingToken);

            var db = _redis.GetDatabase();
            await EnsureConsumerGroupExistsAsync(db, stoppingToken);

            _logger.LogInformation(
                "ScreenVisionWorker started. Stream={Stream} Group={Group} Consumer={Consumer} Provider={Provider}",
                _streamSettings.StreamName, _streamSettings.ConsumerGroup, _consumerName, _vision.ProviderId);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));

            _logger.LogInformation("ScreenVisionWorker stopped.");
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("ScreenVisionWorker cancelled.");
        }
    }

    private async Task WaitForRedisAvailableAsync(CancellationToken ct)
    {
        var delay    = TimeSpan.FromSeconds(1);
        var maxDelay = TimeSpan.FromSeconds(30);
        var attempt  = 0;

        while (!ct.IsCancellationRequested)
        {
            try
            {
                await _redis.GetDatabase().PingAsync();

                if (attempt > 0)
                    _logger.LogInformation("Redis reachable. ScreenVisionWorker resuming.");

                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (RedisException ex)
            {
                attempt++;
                _logger.LogWarning(
                    "ScreenVisionWorker: Redis not available ({Reason}). Retrying in {Delay}s.",
                    ex.Message, Math.Round(delay.TotalSeconds, 1));

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
                    _streamSettings.StreamName,
                    _streamSettings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (RedisException)
            {
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
                    _streamSettings.StreamName,
                    _streamSettings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: _streamSettings.ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(_streamSettings.ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (RedisException ex)
            {
                _logger.LogWarning("ScreenVisionWorker: read interrupted ({Reason}). Reconnecting.", ex.Message);
                await WaitForRedisAvailableAsync(ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_streamSettings.AutoClaimLoopDelaySeconds), ct);

            try
            {
                var result = await db.StreamAutoClaimAsync(
                    _streamSettings.StreamName,
                    _streamSettings.ConsumerGroup,
                    _consumerName,
                    minIdleTimeInMs: _streamSettings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: _streamSettings.AutoClaimBatchSize);

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
                _logger.LogWarning(ex, "ScreenVisionWorker: XAUTOCLAIM iteration failed.");
            }
        }
    }

    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = TryGetField(entry, _streamSettings.PayloadFieldName);
        if (payloadJson is null)
        {
            _logger.LogWarning("Stream entry {Id} missing payload field.", entry.Id);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        ScreenFrameMessage? message;
        try
        {
            message = JsonSerializer.Deserialize<ScreenFrameMessage>(payloadJson, JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Poison screen frame message. Id={Id}", entry.Id);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        if (message is null)
        {
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        var ageMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - message.CapturedAtUnixMs;
        if (ageMs > _streamSettings.StaleFrameAgeMs)
        {
            _logger.LogDebug(
                "Stale frame dropped. Age={AgeMs}ms Tenant={TenantId}",
                ageMs, message.TenantId);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        var sw = Stopwatch.StartNew();
        ScreenAnalysis analysis;

        using var timeoutCts = new CancellationTokenSource(_settings.VisionTimeoutMs);
        using var linkedCts  = CancellationTokenSource.CreateLinkedTokenSource(timeoutCts.Token, ct);

        try
        {
            analysis = await _vision.AnalyzeAsync(message.FrameDataBase64, message.ContentType, linkedCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
        {
            sw.Stop();
            _metrics.VisionTimeouts.Add(1, new KeyValuePair<string, object?>("provider", _vision.ProviderId));
            _logger.LogWarning(
                "Vision model timed out after {ElapsedMs}ms. Tenant={TenantId} Provider={Provider}",
                sw.ElapsedMilliseconds, message.TenantId, _vision.ProviderId);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Vision model call failed. Tenant={TenantId} Provider={Provider}",
                message.TenantId, _vision.ProviderId);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        sw.Stop();
        _metrics.VisionLatencyMs.Record(sw.ElapsedMilliseconds,
            new KeyValuePair<string, object?>("provider", _vision.ProviderId));

        if (!Guid.TryParse(message.TenantId, out var tenantGuid) ||
            !Guid.TryParse(message.StreamerId, out var characterGuid))
        {
            _logger.LogWarning(
                "Invalid TenantId or StreamerId in frame message. Id={Id}", entry.Id);
            await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
            return;
        }

        var detectedAtMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        foreach (var evt in analysis.Events)
        {
            var record = new ScreenEventRecord(
                EventId:        IdGenerator.New().ToString("N"),
                TenantId:       message.TenantId,
                StreamerId:     message.StreamerId,
                SessionId:      message.SessionId,
                EventType:      evt.EventType,
                Confidence:     evt.Confidence,
                Metadata:       evt.Metadata,
                DetectedAtUnixMs: detectedAtMs);

            var recordJson = JsonSerializer.Serialize(record, JsonOptions);

            try
            {
                await _contextRepo.AppendEventAsync(characterGuid, tenantGuid, recordJson, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to persist screen event. EventType={EventType} Tenant={TenantId}",
                    evt.EventType, message.TenantId);
            }

            _metrics.EventsDetected.Add(1,
                new KeyValuePair<string, object?>("tenantId", message.TenantId),
                new KeyValuePair<string, object?>("eventType", evt.EventType));
        }

        _metrics.FramesProcessed.Add(1,
            new KeyValuePair<string, object?>("tenantId", message.TenantId),
            new KeyValuePair<string, object?>("provider", _vision.ProviderId));

        await _usageRecorder.RecordAsync(new VisionUsageEvent(
            TenantId:         message.TenantId,
            StreamerId:       message.StreamerId,
            FramesProcessed:  1,
            EventsDetected:   analysis.Events.Count,
            TokensInputUsed:  0,
            CostUsd:          0m,
            TimestampUtc:     DateTimeOffset.UtcNow));

        await db.StreamAcknowledgeAsync(_streamSettings.StreamName, _streamSettings.ConsumerGroup, entry.Id);
    }

    private static string? TryGetField(StreamEntry entry, string fieldName)
    {
        foreach (var v in entry.Values)
        {
            if (v.Name.ToString() == fieldName)
                return v.Value.ToString();
        }
        return null;
    }

}
