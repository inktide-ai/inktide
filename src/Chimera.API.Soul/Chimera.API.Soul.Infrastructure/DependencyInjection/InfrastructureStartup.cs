using Chimera.API.Core;
using Chimera.API.Soul.Infrastructure.DbContext;
using Chimera.API.Soul.Infrastructure.Settings;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Soul.Infrastructure.DependencyInjection;

public sealed class InfrastructureStartup : IStartup
{

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ResolveConnectionString(ctx.Configuration);

        services.AddDbContext<SoulDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        services.AddDataProtection()
            .SetApplicationName("chimera");

        services.AddHostedService<DatabaseMigrationService>();

        services
            .AddHealthChecks()
            .AddNpgSql(connectionString, name: "soul-postgres", failureStatus: HealthStatus.Degraded);
    }


    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var fullOverride = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(fullOverride))
            return fullOverride.Trim();

        var settings = new PostgresSettings();
        configuration.GetSection(nameof(PostgresSettings)).Bind(settings);

        if (string.IsNullOrEmpty(settings.Password))
            settings.Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? string.Empty;

        if (string.IsNullOrEmpty(settings.Password))
            throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password, " +
                "POSTGRES_PASSWORD, or ConnectionStrings:Postgres.");

        return settings.ToConnectionString();
    }

}
