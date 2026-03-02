using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Chimera.ApiGateway.Application.Contracts.Streaming;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Core.Settings;
using Chimera.ApiGateway.Infrastructure.Hosting;
using Chimera.ApiGateway.Infrastructure.Messaging;
using Chimera.ApiGateway.Infrastructure.Persistence;
using Chimera.ApiGateway.Infrastructure.Settings;
using Chimera.ApiGateway.Infrastructure.Settings.Validators;
using Chimera.ApiGateway.Core.Settings.Validators;

namespace Chimera.ApiGateway.Infrastructure.DependencyInjection;

/// <summary>Infrastructure startup — registers DbContext, messaging pipeline, and health checks.</summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var postgresConnectionString = ResolveConnectionString(ctx.Configuration);

        var redisSettings = new RedisSettings();
        ctx.Configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);

        services.AddDbContext<GatewayDbContext>(options => options.UseNpgsql(postgresConnectionString));

        services.AddOptions<RabbitMqSettings>()
            .BindConfiguration(nameof(RabbitMqSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<RabbitMqSettings>, RabbitMqSettingsValidator>();

        services.AddOptions<SmtpSettings>()
            .BindConfiguration(nameof(SmtpSettings));

        services.AddOptions<AppSettings>()
            .BindConfiguration(nameof(AppSettings));

        var channel = new ChatMessageChannel();
        services.AddSingleton(channel);
        services.AddSingleton<IChatMessageQueue>(channel);
        services.AddSingleton<IRabbitMqChannelProvider, RabbitMqConnectionProvider>();
        services.AddSingleton<IStreamMessageHandler, RabbitMqMessageHandler>();
        services.AddHostedService<RabbitMqPublisherWorker>();
        services.AddHostedService<ChatConnectorHostedService>();

        services
            .AddHealthChecks()
            .AddNpgSql(postgresConnectionString, name: "postgres", failureStatus: HealthStatus.Unhealthy)
            .AddRedis(redisSettings.ToConnectionString(), name: "redis", failureStatus: HealthStatus.Unhealthy)
            .AddCheck<RabbitMqHealthCheck>("rabbitmq", failureStatus: HealthStatus.Unhealthy);
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
