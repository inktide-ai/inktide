using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Twitch.Gateway;

/// <summary>
/// Populates TwitchChannelRegistry from DB on startup, then bulk-JOINs all active channels
/// via TwitchConnector. Throttles JOIN to ≤20 per 10s to respect Twitch IRC rate limits.
/// </summary>
internal sealed class TwitchChannelRegistryLoader(
    IServiceScopeFactory scopeFactory,
    ITwitchChannelRegistry registry,
    ITwitchConnector connector,
    ILogger<TwitchChannelRegistryLoader> logger) : IHostedService
{
    private const int JoinBatchSize      = 20;
    private static readonly TimeSpan JoinBatchDelay = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan ConnectorReadyTimeout = TimeSpan.FromSeconds(30);

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAiCardChannelRepository>();

        var channels = await repo.GetActiveByPlatformAsync(TwitchConnector.PlatformIdValue, cancellationToken)
            .ConfigureAwait(false);

        var logins = channels
            .Where(c => !string.IsNullOrEmpty(c.ChannelId))
            .Select(c => (Login: c.ChannelId!.ToLowerInvariant(), CardId: c.AiCardId))
            .ToList();

        foreach (var (login, cardId) in logins)
            registry.Register(login, cardId);

        logger.LogInformation(
            "TwitchChannelRegistry loaded {Count} channel→soul mappings from database", logins.Count);

        if (logins.Count == 0) return;

        // Wait for IRC connector to be ready before issuing JOINs
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(ConnectorReadyTimeout);

        while (!connector.IsConnected && !timeoutCts.Token.IsCancellationRequested)
            await Task.Delay(500, timeoutCts.Token).ConfigureAwait(false);

        if (!connector.IsConnected)
        {
            logger.LogWarning("TwitchConnector not ready after {Timeout}s — skipping bulk JOIN", ConnectorReadyTimeout.TotalSeconds);
            return;
        }

        // Throttled bulk JOIN: ≤20 channels per 10 seconds
        for (int i = 0; i < logins.Count; i += JoinBatchSize)
        {
            var batch = logins.Skip(i).Take(JoinBatchSize);
            foreach (var (login, _) in batch)
                connector.JoinChannel(login);

            if (i + JoinBatchSize < logins.Count)
                await Task.Delay(JoinBatchDelay, cancellationToken).ConfigureAwait(false);
        }

        logger.LogInformation("TwitchConnector: bulk JOIN complete for {Count} channels", logins.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
