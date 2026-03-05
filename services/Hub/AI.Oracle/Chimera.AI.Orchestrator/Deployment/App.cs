using Microsoft.Extensions.Hosting;

namespace Chimera.AI.Orchestrator.Deployment;

internal sealed class App
{
    private readonly IHost _host;

    public App(IHost host)
    {
        _host = host ?? throw new ArgumentNullException(nameof(host));
    }

    public void Start()
    {
        _host.Run();
    }
}
