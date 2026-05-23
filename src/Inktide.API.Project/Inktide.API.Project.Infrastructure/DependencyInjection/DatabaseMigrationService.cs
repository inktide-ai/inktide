using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Project.Infrastructure.DependencyInjection;

internal sealed class DatabaseMigrationService(
    IServiceScopeFactory scopeFactory,
    ILogger<DatabaseMigrationService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ProjectDbContext>();

        var pending = await db.Database.GetPendingMigrationsAsync(cancellationToken);
        if (!pending.Any())
            return;

        logger.LogInformation("Applying {Count} pending Project migration(s)...", pending.Count());
        await db.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Project migrations applied successfully");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
