using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.MassTransit;
using Inktide.API.Soul.Infrastructure.Cache;
using Inktide.API.Soul.Infrastructure.DbContext;
using Inktide.API.Soul.Infrastructure.Services;
using Inktide.API.Soul.Infrastructure.Messaging;
using Inktide.API.Soul.Infrastructure.Security;
using Inktide.API.Soul.Infrastructure.Settings;
using MassTransit;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.XmlEncryption;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Soul.Infrastructure.DependencyInjection;

public sealed class InfrastructureStartup : IStartup, IBusModuleConfigurator
{

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ResolveConnectionString(ctx.Configuration);

        services.AddDbContext<SoulDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        if (ctx.HostingEnvironment.IsDevelopment())
        {
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        }
        else
        {
            var masterKeyBase64 = ctx.Configuration["DataProtection:MasterKey"]
                ?? throw new InvalidOperationException(
                    "DataProtection:MasterKey is not configured. Generate one with: openssl rand -base64 32");

            var masterKey = Convert.FromBase64String(masterKeyBase64);
            services.AddSingleton(new MasterKeyHolder(masterKey));
            // IXmlEncryptor is resolved from DI by Data Protection automatically
            services.AddSingleton<IXmlEncryptor>(new MasterKeyXmlEncryptor(masterKey));
            services.AddSingleton<IXmlDecryptor, MasterKeyXmlDecryptor>();

            services.AddDataProtection()
                .SetApplicationName("inktide")
                .PersistKeysToDbContext<SoulDbContext>();
        }

        services.AddHttpClient("credential-tester")
            .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(10));

        services.AddScoped<IProjectImportCatalogQuery, ProjectImportCatalogQueryService>();
        services.AddScoped<ICardSummaryProvider, CardSummaryProviderService>();

        services.AddHostedService<DatabaseMigrationService>();
        services.AddHostedService<UserAccountDeletedConsumer>();
        services.AddHostedService<SoulStatusGateSeedWorker>();

        services
            .AddHealthChecks()
            .AddNpgSql(connectionString, name: "soul-postgres", failureStatus: HealthStatus.Degraded, tags: ["ready"]);
    }


    public void ConfigureConsumers(IBusRegistrationConfigurator x)
    {
        x.AddEntityFrameworkOutbox<SoulDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });
        // Soul only publishes - no consumers here.
        // Connector.SoulStatusChangedMTConsumer handles inbound soul status messages.
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
