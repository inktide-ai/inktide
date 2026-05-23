using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Marketplace.Infrastructure.DependencyInjection;

internal sealed class MarketplaceMigrationService(
    IServiceScopeFactory scopeFactory,
    ILogger<MarketplaceMigrationService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<MarketplaceDbContext>();

        var pending = await db.Database.GetPendingMigrationsAsync(cancellationToken);
        if (!pending.Any())
            return;

        logger.LogInformation("Applying {Count} pending Marketplace migration(s)...", pending.Count());
        await db.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Marketplace migrations applied successfully");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
