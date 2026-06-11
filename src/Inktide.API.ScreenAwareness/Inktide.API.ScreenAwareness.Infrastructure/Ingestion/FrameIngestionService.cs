using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Core.Models;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.ScreenAwareness.Application.Settings;
using Inktide.API.ScreenAwareness.Infrastructure.Telemetry;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.ScreenAwareness.Infrastructure.Ingestion;

public sealed class FrameIngestionService : IFrameIngestionService
{

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IConnectionMultiplexer _redis;
    private readonly IVisionBudgetService _budget;
    private readonly IPhashService _pHash;
    private readonly IFrameHashStore _hashStore;
    private readonly ISubscriptionService _subscriptions;
    private readonly ScreenAwarenessSettings _settings;
    private readonly ScreenAwarenessMetrics _metrics;
    private readonly ILogger<FrameIngestionService> _logger;

    public FrameIngestionService(
        IConnectionMultiplexer redis,
        IVisionBudgetService budget,
        IPhashService pHash,
        IFrameHashStore hashStore,
        ISubscriptionService subscriptions,
        IOptions<ScreenAwarenessSettings> settings,
        ScreenAwarenessMetrics metrics,
        ILogger<FrameIngestionService> logger)
    {
        _redis         = redis         ?? throw new ArgumentNullException(nameof(redis));
        _budget        = budget        ?? throw new ArgumentNullException(nameof(budget));
        _pHash         = pHash         ?? throw new ArgumentNullException(nameof(pHash));
        _hashStore     = hashStore     ?? throw new ArgumentNullException(nameof(hashStore));
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
        _settings      = settings.Value;
        _metrics       = metrics       ?? throw new ArgumentNullException(nameof(metrics));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<FrameIngestionResult> IngestAsync(
        Guid tenantId,
        Guid characterId,
        string sessionId,
        string frameBase64,
        string contentType,
        long capturedAtUnixMs,
        CancellationToken ct = default)
    {
        if (!_settings.Enabled)
            return FrameIngestionResult.FeatureDisabled;

        // Resolve subscription plan for budget limits.
        var subscription = await _subscriptions.GetSubscriptionAsync(tenantId.ToString(), ct);
        var plan         = subscription?.Plan ?? PlanType.Free;
        var perCardBudget = 0; // TODO: resolve per-card override from AiCard config

        // Budget check.
        var withinBudget = await _budget.TryConsumeAsync(tenantId, plan, perCardBudget, ct);
        if (!withinBudget)
        {
            _metrics.FramesBudgetExceeded.Add(1, new KeyValuePair<string, object?>("tenantId", tenantId));
            return FrameIngestionResult.BudgetExceeded;
        }

        // Scene deduplication via pHash.
        // On hash failure: skip dedup entirely (do not use 0 as sentinel — it collapses dedup).
        ulong? currentHash = null;
        try
        {
            currentHash = _pHash.ComputeHash(frameBase64);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[FrameIngestion] pHash failed for tenant {TenantId}, skipping dedup", tenantId);
        }

        if (currentHash.HasValue)
        {
            // Atomic GET+SET: returns the previous hash and stores the new one in one round-trip,
            // eliminating the TOCTOU race between read and write under concurrent load.
            var lastHash = await _hashStore.AtomicGetAndSetAsync(tenantId, characterId, currentHash.Value, ct);
            if (lastHash.HasValue && _pHash.HammingDistance(currentHash.Value, lastHash.Value) < _settings.PHashThresholdDefault)
            {
                _metrics.FramesDeduplicated.Add(1, new KeyValuePair<string, object?>("tenantId", tenantId));
                return FrameIngestionResult.DuplicateFrame;
            }
        }

        // Publish to vision worker stream.
        var message = new ScreenFrameMessage(
            tenantId.ToString("N"),
            characterId.ToString("N"),
            sessionId,
            frameBase64,
            contentType,
            capturedAtUnixMs);

        var payload = JsonSerializer.Serialize(message, JsonOptions);
        var db = _redis.GetDatabase();

        await db.StreamAddAsync(
            "screen.frames.pending",
            [new NameValueEntry("payload", payload)],
            maxLength: 1_000,
            useApproximateMaxLength: true);

        _metrics.FramesIngested.Add(1, new KeyValuePair<string, object?>("tenantId", tenantId));
        return FrameIngestionResult.Queued;
    }

}
