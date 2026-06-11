using Inktide.API.Core;
using Inktide.API.Marketplace.Infrastructure.DbContext;
using Inktide.API.Marketplace.Infrastructure.Helpers;
using Inktide.API.Marketplace.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Marketplace.Infrastructure.DependencyInjection;

public sealed class MarketplaceInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = PostgresConnectionStringResolver.Resolve(ctx.Configuration);

        services.AddDbContext<MarketplaceDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddHttpContextAccessor();

        services.AddHttpClient(SoulOwnershipChecker.HttpClientName, c =>
        {
            var baseUrl = ctx.Configuration["MarketplaceSettings:SoulApiBaseUrl"]
                ?? throw new InvalidOperationException("MarketplaceSettings:SoulApiBaseUrl is required but not configured.");
            c.BaseAddress = new Uri(baseUrl.TrimEnd('/') + '/');
            c.Timeout     = TimeSpan.FromSeconds(5);
        });

        services.AddHostedService<MarketplaceMigrationService>();
    }
}
