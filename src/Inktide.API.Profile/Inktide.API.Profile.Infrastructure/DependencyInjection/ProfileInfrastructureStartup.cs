using Inktide.API.Core;
using Inktide.API.Core.MassTransit;
using Inktide.API.Profile.Infrastructure.DbContext;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Messaging;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Profile.Infrastructure.DependencyInjection;

public sealed class ProfileInfrastructureStartup : IStartup, IBusModuleConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ctx.Configuration.GetConnectionString("Postgres")
            ?? BuildConnectionString(ctx.Configuration);

        services.AddDbContext<ProfileDbContext>(options => options.UseNpgsql(connectionString));
        services.AddHostedService<ProfileDbInitializer>();

        services.AddHttpClient(nameof(KeycloakAdminClient), client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
    }

    public void ConfigureConsumers(IBusRegistrationConfigurator x)
    {
        x.AddEntityFrameworkOutbox<ProfileDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });

        x.AddConsumer<KeycloakUserDeletionConsumer>();
        x.AddConsumer<KeycloakEmailUpdateConsumer>();
        x.AddConsumer<KeycloakEmailUpdateFaultConsumer>();
    }

    public void ConfigureEndpoints(
        IReceiveConfigurator<IReceiveEndpointConfigurator> cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("profile-keycloak-delete-user", e =>
        {
            e.UseMessageRetry(r =>
                r.Exponential(5,
                    TimeSpan.FromSeconds(5),
                    TimeSpan.FromMinutes(5),
                    TimeSpan.FromSeconds(10)));
            e.ConfigureConsumer<KeycloakUserDeletionConsumer>(context);
        });

        cfg.ReceiveEndpoint("profile-keycloak-email-update", e =>
        {
            e.UseMessageRetry(r =>
                r.Exponential(10,
                    TimeSpan.FromSeconds(5),
                    TimeSpan.FromHours(1),
                    TimeSpan.FromMinutes(5)));
            e.ConfigureConsumer<KeycloakEmailUpdateConsumer>(context);
        });

        cfg.ReceiveEndpoint("profile-keycloak-email-update-fault", e =>
        {
            e.ConfigureConsumer<KeycloakEmailUpdateFaultConsumer>(context);
        });
    }

    private static string BuildConnectionString(IConfiguration cfg)
    {
        var host     = cfg["PostgresSettings:Host"]     ?? "localhost";
        var port     = cfg["PostgresSettings:Port"]     ?? "5432";
        var db       = cfg["PostgresSettings:Database"] ?? "inktide";
        var username = cfg["PostgresSettings:Username"] ?? throw new InvalidOperationException("PostgresSettings:Username required");
        var password = cfg["PostgresSettings:Password"] ?? throw new InvalidOperationException("PostgresSettings:Password required");
        return $"Host={host};Port={port};Database={db};Username={username};Password={password}";
    }
}
