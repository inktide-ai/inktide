using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Discord.Gateway;

/// <summary>
/// Populates the in-memory GuildSoulRegistry from the database on startup.
/// Queries all active Discord channels across all soul cards.
/// </summary>
internal sealed class GuildRegistryLoader(
    IServiceScopeFactory scopeFactory,
    IGuildSoulRegistry registry,
    ILogger<GuildRegistryLoader> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAiCardChannelRepository>();

        var channels = await repo.GetActiveDiscordChannelsAsync(cancellationToken);
        var entries = channels
            .Where(c => !string.IsNullOrEmpty(c.ChannelId))
            .Select(c => (GuildId: c.ChannelId!, CharacterId: c.AiCardId))
            .ToList();

        registry.BulkLoad(entries);

        logger.LogInformation(
            "GuildSoulRegistry loaded {Count} Discord guild→soul mappings from database",
            entries.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
