using Inktide.API.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Mcp.REST;

public sealed class McpModule : IStartup, IEndpointConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddMcpServer()
                .WithHttpTransport()
                .WithToolsFromAssembly(typeof(McpModule).Assembly);
    }

    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapMcp("/mcp").RequireAuthorization();
    }
}
