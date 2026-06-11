using System.Security.Claims;
using System.Threading.RateLimiting;
using Inktide.API.Billing.REST;
using Inktide.API.Synapse.REST;
using Inktide.API.TTS.REST;
using IStartup = Inktide.API.Core.IStartup;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Deployment;

/// <summary>
/// Registers rate-limiting policies for all endpoints.
/// Must live in <c>Inktide.API</c> (<c>Microsoft.NET.Sdk.Web</c>) because
/// <c>Microsoft.AspNetCore.RateLimiting</c> extension methods are not resolvable
/// from <c>Microsoft.NET.Sdk</c> + FrameworkReference class-library projects.
/// </summary>
public sealed class TtsRateLimiterStartup : IStartup
{
    // Policy name constants used by [EnableRateLimiting] attributes and controllers.
    public const string AuthRateLimitPolicy = "auth";
    public const string GlobalApiRateLimitPolicy = "global-api";

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var authConfig = ctx.Configuration.GetSection("RateLimiting:Auth");
        var authPermitLimit  = authConfig.GetValue("PermitLimit",  100);
        var authWindowSeconds = authConfig.GetValue("WindowSeconds", 60);

        services.AddRateLimiter(options =>
        {
            // Operational abuse protection only. Webhook authenticity enforced via HMAC
            // signature validation. Idempotency handles duplicate delivery.
            options.AddPolicy(BillingRestApiStartup.WebhookRateLimitPolicy, ctx =>
            {
                var key = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                });
            });

            options.AddPolicy(TtsRestApiStartup.SynthesizeRateLimitPolicy, ctx =>
                PerUserFixedWindow(ctx, permitLimit: 20, windowSeconds: 60));

            options.AddPolicy(SynapseRestStartup.DemoChatRateLimitPolicy, ctx =>
            {
                var key = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                });
            });

            options.AddPolicy(AuthRateLimitPolicy, ctx =>
            {
                // Auth endpoints are hit before a valid token exists — partition by IP.
                var key = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = authPermitLimit,
                    Window = TimeSpan.FromSeconds(authWindowSeconds),
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                });
            });

            // Applied as the default policy — protects all routes without explicit policy.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
            {
                var userId = ctx.User.FindFirstValue("sub")
                          ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (userId is not null)
                    return RateLimitPartition.GetSlidingWindowLimiter(userId, _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 300,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6,
                        QueueLimit = 0,
                    });

                // Unauthenticated (health checks, OBS source, etc.): 60 req/min per IP.
                var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueLimit = 0,
                });
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
    }


    private static RateLimitPartition<string> PerUserFixedWindow(
        HttpContext ctx,
        int permitLimit,
        int windowSeconds)
    {
        var key = ctx.User.FindFirstValue("sub")
               ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? ctx.Connection.RemoteIpAddress?.ToString()
               ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromSeconds(windowSeconds),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        });
    }
}
