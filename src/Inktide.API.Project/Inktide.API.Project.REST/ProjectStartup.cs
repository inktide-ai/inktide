using Inktide.API.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Project.REST;

public sealed class ProjectStartup : IStartup, IEndpointConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddControllers()
            .AddApplicationPart(typeof(ProjectStartup).Assembly)
            .AddNewtonsoftJson();
    }

    public void Map(IEndpointRouteBuilder app)
    {
        app.MapControllers();
    }
}
