using Microsoft.AspNetCore.Hosting;

namespace Chimera.AI.Orchestrator.Core;

/// <summary>
/// Configure the web host (Kestrel endpoints, protocols, TLS).
/// </summary>
public interface IWebHostConfigurator
{
    void Configure(IWebHostBuilder webHostBuilder);
}
