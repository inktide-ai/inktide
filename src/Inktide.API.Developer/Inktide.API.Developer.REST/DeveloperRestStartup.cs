using Inktide.API.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Serialization;

namespace Inktide.API.Developer.REST;

public sealed class DeveloperRestStartup : IStartup, IEndpointConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services
            .AddControllers()
            .AddApplicationPart(typeof(DeveloperRestStartup).Assembly)
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            });
    }

    public void Map(IEndpointRouteBuilder app) => app.MapControllers();
}
