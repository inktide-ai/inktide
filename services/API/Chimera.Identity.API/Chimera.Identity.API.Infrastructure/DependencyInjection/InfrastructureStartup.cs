using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.Core.Settings;
using Chimera.Identity.Infrastructure.Persistence;
using Chimera.Identity.Infrastructure.Settings;
using Chimera.Identity.API.Core.Settings.Validators;

namespace Chimera.Identity.Infrastructure.DependencyInjection;

/// <summary>Infrastructure startup — registers DbContext and health checks.</summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var postgresConnectionString = ResolveConnectionString(ctx.Configuration);

        var redisSettings = new RedisSettings();
        ctx.Configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);

        services.AddDbContext<GatewayDbContext>(options => options.UseNpgsql(postgresConnectionString));

        services.AddOptions<SmtpSettings>()
            .BindConfiguration(nameof(SmtpSettings));

        services.AddOptions<AppSettings>()
            .BindConfiguration(nameof(AppSettings));

        services.AddOptions<AuthSettings>()
            .BindConfiguration(nameof(AuthSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<AuthSettings>, AuthSettingsValidator>();

        services.AddOptions<RedisSettings>()
            .BindConfiguration(nameof(RedisSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<RedisSettings>, RedisSettingsValidator>();

        services
            .AddHealthChecks()
            .AddNpgSql(postgresConnectionString, name: "postgres", failureStatus: HealthStatus.Unhealthy)
            .AddRedis(redisSettings.ToConnectionString(), name: "redis", failureStatus: HealthStatus.Unhealthy);
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var fullOverride = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(fullOverride))
        {
            return fullOverride.Trim();
        }

        var settings = new PostgresSettings();
        configuration.GetSection(nameof(PostgresSettings)).Bind(settings);

        if (string.IsNullOrEmpty(settings.Password))
        {
            settings.Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? string.Empty;
        }

        if (string.IsNullOrEmpty(settings.Password))
        {
            throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password, " +
                "POSTGRES_PASSWORD, or ConnectionStrings:Postgres.");
        }

        return settings.ToConnectionString();
    }
}
