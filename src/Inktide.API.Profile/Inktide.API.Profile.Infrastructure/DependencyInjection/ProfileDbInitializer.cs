using Inktide.API.Profile.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.DependencyInjection;

/// <summary>
/// Ensures soul.user_profiles table exists on startup.
/// ProfileDbContext now owns this table (moved from SoulDbContext in R5).
/// Uses EnsureCreated so it's idempotent on existing installations.
/// </summary>
internal sealed class ProfileDbInitializer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProfileDbInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ProfileDbContext>();

        await db.Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS soul", cancellationToken);
        await db.Database.EnsureCreatedAsync(cancellationToken);

        logger.LogInformation("ProfileDbContext initialized (soul.user_profiles ready)");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
