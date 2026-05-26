using Inktide.API.Soul.Application.Interfaces;
using StackExchange.Redis;

namespace Inktide.API.Soul.Infrastructure.Cache;

internal sealed class SoulStatusGateRedisCache : IAiCardStatusGateCache
{
    private readonly IConnectionMultiplexer _redis;

    public SoulStatusGateRedisCache(IConnectionMultiplexer redis)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
    }

    public Task BlockAsync(Guid cardId, CancellationToken ct = default)
        => _redis.GetDatabase().StringSetAsync(GateKey(cardId), "1");

    public Task UnblockAsync(Guid cardId, CancellationToken ct = default)
        => _redis.GetDatabase().KeyDeleteAsync(GateKey(cardId));

    internal static string GateKey(Guid cardId) => $"soul:{cardId}:blocked";
}
