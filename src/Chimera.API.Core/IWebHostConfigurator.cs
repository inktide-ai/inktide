using Microsoft.AspNetCore.Hosting;

namespace Chimera.API.Core;

/// <summary>
/// Plugin contract for configuring the web host (Kestrel endpoints, URLs).
/// Implementations are discovered from loaded module assemblies and invoked during host build.
/// </summary>
public interface IWebHostConfigurator
{
    /// <summary>
    /// Configures the web host (e.g. REST HTTP endpoint, gRPC HTTP/2 endpoint).
    /// </summary>
    /// <param name="webHostBuilder">The web host builder.</param>
    void Configure(IWebHostBuilder webHostBuilder);
}
