using Inktide.API.Graph.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.DependencyInjection;

internal sealed class GraphDatabaseMigrationService(
    IServiceScopeFactory scopeFactory,
    ILogger<GraphDatabaseMigrationService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GraphDbContext>();

        var pending = await db.Database.GetPendingMigrationsAsync(cancellationToken);
        if (!pending.Any())
            return;

        logger.LogInformation("Applying {Count} pending Graph migration(s)...", pending.Count());
        await db.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Graph migrations applied successfully");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
