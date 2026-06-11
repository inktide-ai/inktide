using System.Net.Http.Headers;
using System.Text;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.DbContext;
using Inktide.API.Billing.Infrastructure.Messaging;
using Inktide.API.Billing.Infrastructure.Providers.Robokassa;
using Inktide.API.Billing.Infrastructure.Providers.Stripe;
using Inktide.API.Billing.Infrastructure.Providers.YooKassa;
using Inktide.API.Billing.Infrastructure.Repositories;
using Inktide.API.Billing.Infrastructure.Services;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Billing.Infrastructure.Telemetry;
using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.MassTransit;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Billing.Infrastructure.DependencyInjection;

public sealed class BillingInfrastructureStartup : IStartup, IBusModuleConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var config = ctx.Configuration;

        // Provider-agnostic billing settings (SuccessUrl, CancelUrl, ActiveProvider)
        var billing = new BillingSettings();
        config.GetSection(nameof(BillingSettings)).Bind(billing);
        services.AddSingleton(billing);

        // YooKassa settings (always registered so webhook processor can be constructed)
        var yooKassa = new YooKassaSettings();
        config.GetSection(nameof(YooKassaSettings)).Bind(yooKassa);
        services.AddSingleton(yooKassa);

        // Robokassa settings
        var robokassa = new RobokassaSettings();
        config.GetSection(nameof(RobokassaSettings)).Bind(robokassa);
        if (billing.ActiveProvider.Equals("robokassa", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(robokassa.Password1))
                throw new InvalidOperationException(
                    "RobokassaSettings.Password1 is required. Set RobokassaSettings__Password1 in .env");
            if (string.IsNullOrWhiteSpace(robokassa.Password2))
                throw new InvalidOperationException(
                    "RobokassaSettings.Password2 is required. Set RobokassaSettings__Password2 in .env");
        }
        services.AddSingleton(robokassa);

        // Stripe settings
        var stripe = new StripeSettings();
        config.GetSection(nameof(StripeSettings)).Bind(stripe);
        if (string.IsNullOrWhiteSpace(stripe.WebhookSecret))
            throw new InvalidOperationException(
                "StripeSettings.WebhookSecret is required. Set StripeSettings__WebhookSecret in .env");
        services.AddSingleton(stripe);

        // Database
        var connStr = BuildConnectionString(config);
        services.AddDbContext<BillingDbContext>(opts =>
            opts.UseNpgsql(connStr, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_billing_migrations", "billing")));

        // Typed HTTP clients — handler pool is managed by IHttpClientFactory (fixes socket exhaustion).
        void ConfigureYooKassaClient(HttpClient client)
        {
            client.BaseAddress = new Uri("https://api.yookassa.ru/v3");
            var creds = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{yooKassa.ShopId}:{yooKassa.SecretKey}"));
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Basic", creds);
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }

        services.AddHttpClient<YooKassaBillingProvider>(ConfigureYooKassaClient);
        services.AddHttpClient<YooKassaWebhookProcessor>(ConfigureYooKassaClient);
        services.AddHttpClient("yookassa-renewal", ConfigureYooKassaClient);

        // AddHttpClient<YooKassaBillingProvider> already registers YooKassaBillingProvider as a
        // transient with its configured HttpClient — adding AddTransient<YooKassaBillingProvider>()
        // after it would override that registration. RobokassaBillingProvider has no typed
        // HttpClient, so it needs an explicit registration so the factory below can resolve it.
        services.AddTransient<RobokassaBillingProvider>();

        // Active checkout provider — resolved by name. Adding a new provider requires one new arm.
        services.AddTransient<IBillingProvider>(sp =>
        {
            var activeId = sp.GetRequiredService<BillingSettings>().ActiveProvider;
            return activeId.ToLowerInvariant() switch
            {
                "robokassa" => (IBillingProvider)sp.GetRequiredService<RobokassaBillingProvider>(),
                "yookassa"  => sp.GetRequiredService<YooKassaBillingProvider>(),
                var id      => throw new InvalidOperationException($"Unknown billing provider: '{id}'")
            };
        });

        // Stripe typed HttpClient
        services.AddHttpClient<IStripeService, StripeService>(client =>
        {
            client.BaseAddress = new Uri("https://api.stripe.com/v1/");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", stripe.SecretKey);
        });

        services.AddTransient<IWebhookProcessor, YooKassaWebhookProcessor>();
        services.AddTransient<IWebhookProcessor, RobokassaWebhookProcessor>();
        services.AddTransient<IWebhookProcessor, StripeWebhookProcessor>();

        // SMTP for payment receipt emails (binds same SmtpSettings__* env vars as Profile context)
        var billingSmtp = new BillingSmtpSettings();
        config.GetSection("SmtpSettings").Bind(billingSmtp);
        services.AddSingleton(billingSmtp);
        services.AddTransient<IPaymentReceiptEmailService, PaymentReceiptEmailService>();

        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton<BillingMetrics>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IBillingIncidentRepository, BillingIncidentRepository>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IUserPlanResolver, PlanLimitResolver>();

        services.AddHostedService<Messaging.UserAccountDeletedConsumer>();
        services.AddHostedService<Services.SubscriptionExpiryJob>();
        services.AddHostedService<Providers.YooKassa.YooKassaRenewalJob>();
    }

    public void ConfigureConsumers(IBusRegistrationConfigurator x)
    {
        x.AddEntityFrameworkOutbox<BillingDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });

        x.AddConsumer<ReceiptEmailConsumer>();
        x.AddConsumer<YooKassaRenewalConsumer>();
        x.AddConsumer<YooKassaRenewalFaultConsumer>();
    }

    public void ConfigureEndpoints(
        IReceiveConfigurator<IReceiveEndpointConfigurator> cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("billing-receipt-email", e =>
        {
            e.UseMessageRetry(r =>
                r.Exponential(5,
                    TimeSpan.FromSeconds(10),
                    TimeSpan.FromMinutes(5),
                    TimeSpan.FromSeconds(15)));
            e.ConfigureConsumer<ReceiptEmailConsumer>(context);
        });

        cfg.ReceiveEndpoint("billing-yookassa-renewal", e =>
        {
            e.UseMessageRetry(r =>
                r.Exponential(3,
                    TimeSpan.FromMinutes(5),
                    TimeSpan.FromMinutes(30),
                    TimeSpan.FromMinutes(5)));
            e.ConfigureConsumer<YooKassaRenewalConsumer>(context);
        });

        cfg.ReceiveEndpoint("billing-yookassa-renewal-fault", e =>
        {
            e.ConfigureConsumer<YooKassaRenewalFaultConsumer>(context);
        });
    }

    private static string BuildConnectionString(IConfiguration config)
    {
        var cs = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(cs)) return cs;

        var host = config["PostgresSettings:Host"] ?? "localhost";
        var port = config["PostgresSettings:Port"] ?? "5432";
        var db   = config["PostgresSettings:Database"] ?? "inktide";
        var user = config["PostgresSettings:Username"] ?? "inktide-admin";
        var pass = config["PostgresSettings:Password"] ?? "";
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass}";
    }
}
