using Inktide.API.Core;
using Inktide.API.Core.MassTransit;
using Inktide.API.Developer.Infrastructure.Messaging;
using Inktide.API.Developer.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Developer.Infrastructure.DependencyInjection;

public sealed class DeveloperInfrastructureStartup : IStartup, IBusModuleConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ctx.Configuration.GetConnectionString("Postgres")
            ?? BuildConnectionString(ctx.Configuration);

        services.AddDbContext<DeveloperDbContext>(options => options.UseNpgsql(connectionString));
        services.AddHostedService<DeveloperDbInitializer>();

        services.AddHttpClient("DeveloperKeycloakAdmin", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient("WebhookDelivery", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });
    }

    public void ConfigureConsumers(IBusRegistrationConfigurator x)
    {
        x.AddEntityFrameworkOutbox<DeveloperDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });

        x.AddConsumer<WebhookDeliveryConsumer>();
        x.AddConsumer<WebhookDeliveryFaultConsumer>();
    }

    public void ConfigureEndpoints(
        IReceiveConfigurator<IReceiveEndpointConfigurator> cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("webhook-delivery", e =>
        {
            e.UseMessageRetry(r =>
                r.Exponential(5,
                    TimeSpan.FromSeconds(2),
                    TimeSpan.FromMinutes(10),
                    TimeSpan.FromSeconds(2)));
            e.ConfigureConsumer<WebhookDeliveryConsumer>(context);
        });

        cfg.ReceiveEndpoint("webhook-delivery-fault", e =>
        {
            e.ConfigureConsumer<WebhookDeliveryFaultConsumer>(context);
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
