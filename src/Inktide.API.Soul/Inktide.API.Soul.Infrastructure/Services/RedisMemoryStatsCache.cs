using Inktide.API.Soul.Application.Interfaces;
using StackExchange.Redis;

namespace Inktide.API.Soul.Infrastructure.Services;

/// <summary>
/// Reads the total memory count published by the Memory bounded context into Redis.
/// Key: "memory:stats:total" — written by Memory on ingest and deletion.
/// Returns 0 when the key is absent (Memory has not published yet, or Redis is cold).
/// </summary>
public sealed class RedisMemoryStatsCache : IMemoryStatsCache
{
    private const string Key = "memory:stats:total";

    private readonly IConnectionMultiplexer _redis;

    public RedisMemoryStatsCache(IConnectionMultiplexer redis) =>
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));

    public async Task<int> GetTotalCountAsync(CancellationToken ct = default)
    {
        var db  = _redis.GetDatabase();
        var val = await db.StringGetAsync(Key).ConfigureAwait(false);
        return val.TryParse(out int count) ? count : 0;
    }
}
