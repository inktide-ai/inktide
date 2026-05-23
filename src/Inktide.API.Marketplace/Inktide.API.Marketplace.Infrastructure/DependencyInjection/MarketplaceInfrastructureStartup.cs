using Inktide.API.Core;
using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Marketplace.Infrastructure.DependencyInjection;

public sealed class MarketplaceInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ResolveConnectionString(ctx.Configuration);

        services.AddDbContext<MarketplaceDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddHttpContextAccessor();

        services.AddHttpClient("soul-ownership", c =>
        {
            var baseUrl = ctx.Configuration["MarketplaceSettings:SoulApiBaseUrl"]
                ?? "http://127.0.0.1:5001/";
            c.BaseAddress = new Uri(baseUrl.TrimEnd('/') + '/');
            c.Timeout     = TimeSpan.FromSeconds(5);
        });

        services.AddHostedService<MarketplaceMigrationService>();
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var full = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(full))
            return full.Trim();

        var host     = configuration["PostgresSettings:Host"]     ?? "localhost";
        var port     = configuration["PostgresSettings:Port"]     ?? "5432";
        var database = configuration["PostgresSettings:Database"] ?? "inktide";
        var username = configuration["PostgresSettings:Username"] ?? "postgres";
        var password = configuration["PostgresSettings:Password"]
            ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
            ?? throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password or POSTGRES_PASSWORD.");

        return $"Host={host};Port={port};Database={database};Username={username};Password={password}";
    }
}
