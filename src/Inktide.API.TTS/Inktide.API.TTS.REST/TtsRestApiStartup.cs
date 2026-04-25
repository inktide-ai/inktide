using Inktide.API.Core;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Inktide.API.TTS.REST;

/// <summary>
/// Registers ASP.NET Core controllers, FluentValidation and memory cache for the TTS REST API.
/// <para>
/// Rate limiting: policy <see cref="SynthesizeRateLimitPolicy"/> is applied on POST /synthesize via
/// <c>[EnableRateLimiting]</c>, but <c>AddRateLimiter()</c> must be called in the host project
/// (<c>Inktide.API</c>) because <c>Microsoft.AspNetCore.RateLimiting</c> extension methods are
/// only resolvable in <c>Microsoft.NET.Sdk.Web</c> projects.
/// </para>
/// </summary>
public sealed class TtsRestApiStartup : IStartup
{
    /// <summary>Rate-limiter policy name applied to <c>POST /api/v1/tts/synthesize</c>.</summary>
    public const string SynthesizeRateLimitPolicy = "tts-synthesize";


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
        services.AddValidatorsFromAssemblyContaining<TtsRestApiStartup>();

        services.AddMemoryCache();
    }

}
