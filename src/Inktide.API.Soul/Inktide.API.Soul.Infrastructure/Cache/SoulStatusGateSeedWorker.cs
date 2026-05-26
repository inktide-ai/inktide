using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Soul.Infrastructure.Cache;

/// <summary>
/// Seeds the Synapse gate keys in Redis on startup so that paused/stopped souls
/// remain blocked across container restarts.
/// </summary>
internal sealed class SoulStatusGateSeedWorker : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<SoulStatusGateSeedWorker> _logger;

    public SoulStatusGateSeedWorker(
        IServiceScopeFactory scopeFactory,
        IConnectionMultiplexer redis,
        ILogger<SoulStatusGateSeedWorker> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SoulDbContext>();

        var blockedIds = await db.Set<Domain.Entities.AiCard>()
            .Where(c => !c.IsActive || c.Status == AiCardStatus.Paused || c.Status == AiCardStatus.Stopped)
            .Where(c => c.DeletedAt == null)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        if (blockedIds.Count == 0) return;

        var redisDb = _redis.GetDatabase();
        foreach (var cardId in blockedIds)
            await redisDb.StringSetAsync(SoulStatusGateRedisCache.GateKey(cardId), "1").ConfigureAwait(false);

        _logger.LogInformation("SoulStatusGateSeedWorker: seeded {Count} blocked soul gate keys", blockedIds.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
