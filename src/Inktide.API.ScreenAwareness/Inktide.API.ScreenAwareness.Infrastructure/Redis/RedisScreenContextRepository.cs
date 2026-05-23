using System.Text.Json;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.ScreenAwareness.Infrastructure.Redis;

public sealed class RedisScreenContextRepository : IScreenContextRepository
{

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisScreenContextRepository> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public RedisScreenContextRepository(
        IConnectionMultiplexer redis,
        ILogger<RedisScreenContextRepository> logger)
    {
        _redis  = redis  ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    private static string ContextKey(Guid characterId) => $"screen:ctx:{characterId:N}";
    private static string AuditStreamKey(Guid tenantId) => $"screen.events.{tenantId:N}";

    public async Task<ScreenContext?> GetRecentAsync(Guid characterId, TimeSpan window, CancellationToken ct = default)
    {
        var db       = _redis.GetDatabase();
        var minScore = (double)(DateTimeOffset.UtcNow - window).ToUnixTimeMilliseconds();
        var maxScore = (double)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        SortedSetEntry[] entries;
        try
        {
            entries = await db.SortedSetRangeByScoreWithScoresAsync(
                ContextKey(characterId), minScore, maxScore);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ScreenContext] Redis read failed for character {CharacterId}", characterId);
            return null;
        }

        if (entries.Length == 0) return null;

        var summaries = entries
            .Select(e =>
            {
                try
                {
                    var record = JsonSerializer.Deserialize<ScreenEventRecord>(e.Element.ToString(), JsonOpts);
                    if (record is null) return null;
                    return new ScreenEventSummary(
                        record.EventType,
                        record.Confidence,
                        record.Metadata,
                        DateTimeOffset.FromUnixTimeMilliseconds(record.DetectedAtUnixMs));
                }
                catch
                {
                    return (ScreenEventSummary?)null;
                }
            })
            .Where(s => s is not null)
            .Cast<ScreenEventSummary>()
            .OrderByDescending(s => s.DetectedAt)
            .ToList();

        return summaries.Count == 0
            ? null
            : new ScreenContext(summaries, DateTimeOffset.UtcNow);
    }

    public async Task AppendEventAsync(Guid characterId, Guid tenantId, string eventRecordJson, CancellationToken ct = default)
    {
        ScreenEventRecord? record;
        try
        {
            record = JsonSerializer.Deserialize<ScreenEventRecord>(eventRecordJson, JsonOpts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ScreenContext] Failed to deserialize ScreenEventRecord");
            return;
        }

        if (record is null) return;

        var db           = _redis.GetDatabase();
        var score        = (double)record.DetectedAtUnixMs;
        var contextKey   = ContextKey(characterId);
        var auditKey     = AuditStreamKey(tenantId);
        var nowMs        = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var pruneBeforeMs = nowMs - 60_000;

        try
        {
            var batch = db.CreateBatch();
            var addTask     = batch.SortedSetAddAsync(contextKey, eventRecordJson, score);
            var pruneTask   = batch.SortedSetRemoveRangeByScoreAsync(contextKey, double.NegativeInfinity, pruneBeforeMs);
            var expireTask  = batch.KeyExpireAsync(contextKey, TimeSpan.FromSeconds(120));
            var streamTask  = batch.StreamAddAsync(
                auditKey,
                [new NameValueEntry("payload", eventRecordJson)],
                maxLength: 1000,
                useApproximateMaxLength: true);
            batch.Execute();
            await Task.WhenAll(addTask, pruneTask, expireTask, streamTask);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ScreenContext] Redis write failed for character {CharacterId}", characterId);
        }
    }

}
