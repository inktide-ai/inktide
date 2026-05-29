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

        // Idempotent: creates user_preferences for existing installations where EnsureCreated is a no-op.
        // JSONB defaults omitted — app always provides values on upsert; avoids EF format-string parser bug with '{}'.
        await db.Database.ExecuteSqlRawAsync(
            "CREATE TABLE IF NOT EXISTS soul.user_preferences (" +
            "  user_id        VARCHAR(64)  PRIMARY KEY," +
            "  appearance     JSONB        NOT NULL," +
            "  language       VARCHAR(16)  NOT NULL DEFAULT 'en'," +
            "  notifications  JSONB        NOT NULL," +
            "  favorites      TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[]," +
            "  hub_layouts    JSONB        NOT NULL," +
            "  scene_settings JSONB        NOT NULL," +
            "  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()" +
            ")",
            cancellationToken);

        logger.LogInformation("ProfileDbContext initialized (soul.user_profiles + soul.user_preferences ready)");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
