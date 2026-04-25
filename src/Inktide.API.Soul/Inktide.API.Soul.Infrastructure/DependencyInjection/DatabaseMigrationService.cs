using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Infrastructure.DependencyInjection;

internal sealed class DatabaseMigrationService(
    IServiceScopeFactory scopeFactory,
    ILogger<DatabaseMigrationService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SoulDbContext>();

        var pending = await db.Database.GetPendingMigrationsAsync(cancellationToken);
        if (!pending.Any())
            return;

        logger.LogInformation("Applying {Count} pending Soul migration(s)...", pending.Count());
        await db.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Soul migrations applied successfully");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
