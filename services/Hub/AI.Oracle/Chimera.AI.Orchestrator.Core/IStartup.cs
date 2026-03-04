using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.AI.Orchestrator.Core;

/// <summary>
/// Register services into the MS DI <see cref="IServiceCollection"/> during host building.
/// </summary>
public interface IStartup
{
    void ConfigureServices(
        HostBuilderContext ctx,
        IServiceCollection services);
}
