using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.ApiGateway.Core;

/// <summary>
/// Plugin contract for registering services into the host's <see cref="IServiceCollection"/> (MS DI).
/// Implementations are discovered from loaded module assemblies and invoked during host build.
/// </summary>
public interface IStartup
{
    /// <summary>
    /// Registers application and infrastructure services (e.g. DbContext, health checks, hosted services).
    /// </summary>
    /// <param name="ctx">Host builder context (configuration, environment).</param>
    /// <param name="services">The service collection to register into.</param>
    void ConfigureServices(HostBuilderContext ctx, IServiceCollection services);
}