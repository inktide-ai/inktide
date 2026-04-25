using System.Security.Claims;
using System.Threading.RateLimiting;
using Inktide.API.TTS.REST;
using IStartup = Inktide.API.Core.IStartup;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Deployment;

/// <summary>
/// Registers rate-limiting policies for all TTS endpoints.
/// Must live in <c>Inktide.API</c> (<c>Microsoft.NET.Sdk.Web</c>) because
/// <c>Microsoft.AspNetCore.RateLimiting</c> extension methods are not resolvable
/// from <c>Microsoft.NET.Sdk</c> + FrameworkReference class-library projects.
/// </summary>
public sealed class TtsRateLimiterStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            // Per-user fixed window (20 req/min). Partitioned by JWT sub claim, falls back to IP.
            options.AddPolicy(TtsRestApiStartup.SynthesizeRateLimitPolicy, context =>
            {
                var key =
                    context.User.FindFirstValue("sub") ??
                    context.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                    context.Connection.RemoteIpAddress?.ToString() ??
                    "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                });
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
    }
}
