using Chimera.API.Core;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Chimera.API.TTS.REST;

/// <summary>
/// Registers ASP.NET Core controllers and FluentValidation for TTS REST API.
/// </summary>
public sealed class TtsRestApiStartup : IStartup
{
    #region Public Methods

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
    }

    #endregion
}
