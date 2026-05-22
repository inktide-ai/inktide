using Inktide.API.ScreenAwareness.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.ScreenAwareness.Infrastructure.Redis;

public sealed class RedisFrameHashStore : IFrameHashStore
{

    // Atomically returns the old hash and sets the new one with a TTL — one round-trip.
    private static readonly LuaScript AtomicGetSet = LuaScript.Prepare(
        "local old = redis.call('GET', @key)\n" +
        "redis.call('SET', @key, @value, 'EX', @ttl)\n" +
        "return old");

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisFrameHashStore> _logger;

    public RedisFrameHashStore(IConnectionMultiplexer redis, ILogger<RedisFrameHashStore> logger)
    {
        _redis  = redis  ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    private static string Key(Guid tenantId, Guid streamerId)
        => $"screen:hash:{tenantId:N}:{streamerId:N}";

    public async Task<ulong?> AtomicGetAndSetAsync(Guid tenantId, Guid streamerId, ulong newHash, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        var result = await db.ScriptEvaluateAsync(AtomicGetSet, new
        {
            key   = (RedisKey)Key(tenantId, streamerId),
            value = newHash.ToString(),
            ttl   = 3600,
        });
        if (result.IsNull) return null;
        return ulong.TryParse((string?)result, out var v) ? v : null;
    }

}
