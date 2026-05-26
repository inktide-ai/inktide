using Inktide.API.Memory.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Memory.Infrastructure.DependencyInjection;

/// <summary>
/// Ensures soul.memory_metadata table exists on startup.
/// MemoryDbContext now owns this table (moved from SoulDbContext in R4).
/// Uses EnsureCreated so it's idempotent on existing installations.
/// </summary>
internal sealed class MemoryDbInitializer(
    IServiceScopeFactory scopeFactory,
    ILogger<MemoryDbInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<MemoryDbContext>();

        await db.Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS soul", cancellationToken);
        // TODO: Replace with db.Database.MigrateAsync() once EF migrations are set up for
        // MemoryDbContext. EnsureCreatedAsync is a no-op on existing databases and will not
        // apply future schema changes.
        await db.Database.EnsureCreatedAsync(cancellationToken);

        logger.LogInformation("MemoryDbContext initialized (soul.memory_metadata ready)");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
