using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Billing.REST;

public sealed class BillingRestApiStartup : IStartup, IMiddlewareConfigurator, IEndpointConfigurator
{
    // Policy name constant - registered in Inktide.API/Deployment/TtsRateLimiterStartup.cs
    // (AddRateLimiter requires Microsoft.NET.Sdk.Web which is unavailable in REST class-library projects)
    public const string WebhookRateLimitPolicy = "billing-webhook";

    // Must run before AuthMiddlewareConfigurator (Order=10) which calls UseRouting().
    // ForwardedHeaders must resolve RemoteIpAddress before routing touches the request.
    public int Order => 5;

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services
            .AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            });

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            // Trust only the reverse proxy on the same host (nginx/caddy -> loopback -> Kestrel).
            // Clear defaults first - ASP.NET Core adds loopback to KnownNetworks by default, but
            // that would trust ANY source on loopback, not just a configured proxy.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            options.KnownProxies.Add(IPAddress.Loopback);
            options.KnownProxies.Add(IPAddress.IPv6Loopback);
            // Process only the rightmost XFF hop - attacker-supplied left-side entries are ignored.
            options.ForwardLimit = 1;
        });
    }

    public void Configure(IApplicationBuilder app)
    {
        app.UseForwardedHeaders();
    }

    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapControllers();
    }
}
