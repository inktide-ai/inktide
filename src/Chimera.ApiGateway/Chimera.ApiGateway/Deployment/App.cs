using Microsoft.Extensions.Hosting;

namespace Chimera.ApiGateway.Deployment;

/// <summary>
/// Application host entry point. Resolved from the DI container and started by <see cref="Program"/>.
/// </summary>
internal sealed class App
{
    private readonly IHost _host;

    public App(IHost host)
    {
        _host = host ?? throw new ArgumentNullException(nameof(host));
    }

    /// <summary>
    /// Runs the configured web host (Kestrel, health checks, hosted services).
    /// </summary>
    public void Start()
    {
        _host.Run();
    }
}
