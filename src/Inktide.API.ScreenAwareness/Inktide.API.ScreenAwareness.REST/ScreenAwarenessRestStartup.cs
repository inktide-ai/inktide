using FluentValidation;
using FluentValidation.AspNetCore;
using Inktide.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Inktide.API.ScreenAwareness.REST;

/// <summary>
/// Registers ASP.NET Core controllers and FluentValidation for the Screen Awareness REST API.
/// <para>
/// Rate limiting: policy <see cref="FrameIngestRateLimitPolicy"/> is applied on POST /api/screen/frame
/// via <c>[EnableRateLimiting]</c>, but <c>AddRateLimiter()</c> must be called in <c>Inktide.API</c>
/// because <c>Microsoft.AspNetCore.RateLimiting</c> is only available in SDK.Web projects.
/// </para>
/// </summary>
public sealed class ScreenAwarenessRestStartup : IStartup
{
    /// <summary>Rate-limiter policy name for <c>POST /api/screen/frame</c>.</summary>
    public const string FrameIngestRateLimitPolicy = "screen-frame-ingest";

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services
            .AddControllers()
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
            });

        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<ScreenAwarenessRestStartup>();
    }
}
