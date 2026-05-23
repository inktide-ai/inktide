using System.Net.Http.Headers;
using System.Text;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.DbContext;
using Inktide.API.Billing.Infrastructure.Providers.LemonSqueezy;
using Inktide.API.Billing.Infrastructure.Providers.YooKassa;
using Inktide.API.Billing.Infrastructure.Repositories;
using Inktide.API.Billing.Infrastructure.Services;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Billing.Infrastructure.DependencyInjection;

public sealed class BillingInfrastructureStartup : IStartup
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

        // LemonSqueezy settings
        var lsSettings = new LemonSqueezySettings();
        config.GetSection(nameof(LemonSqueezySettings)).Bind(lsSettings);
        services.AddSingleton(lsSettings);

        // Database
        var connStr = BuildConnectionString(config);
        services.AddDbContext<BillingDbContext>(opts =>
            opts.UseNpgsql(connStr, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_billing_migrations", "billing")));

        // Typed HTTP clients — handler pool is managed by IHttpClientFactory (fixes socket exhaustion).
        services.AddHttpClient<YooKassaBillingProvider>(client =>
        {
            client.BaseAddress = new Uri("https://api.yookassa.ru/v3");
            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{yooKassa.ShopId}:{yooKassa.SecretKey}"));
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Basic", credentials);
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        });
        services.AddHttpClient<YooKassaWebhookProcessor>(client =>
        {
            client.BaseAddress = new Uri("https://api.yookassa.ru/v3");
            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{yooKassa.ShopId}:{yooKassa.SecretKey}"));
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Basic", credentials);
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        });
        services.AddHttpClient<LemonSqueezyBillingProvider>(client =>
        {
            client.BaseAddress = new Uri("https://api.lemonsqueezy.com/v1");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", lsSettings.ApiKey);
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.api+json"));
        });

        // Active checkout provider — transient so typed HttpClient lifetime is respected.
        if (billing.ActiveProvider.Equals("yookassa", StringComparison.OrdinalIgnoreCase))
            services.AddTransient<IBillingProvider, YooKassaBillingProvider>();
        else
            services.AddTransient<IBillingProvider, LemonSqueezyBillingProvider>();

        // All webhook processors registered — WebhookController routes by ProviderId.
        services.AddTransient<IWebhookProcessor, YooKassaWebhookProcessor>();
        services.AddTransient<IWebhookProcessor, LemonSqueezyWebhookProcessor>();

        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();

        services.AddHostedService<Messaging.UserAccountDeletedConsumer>();
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
