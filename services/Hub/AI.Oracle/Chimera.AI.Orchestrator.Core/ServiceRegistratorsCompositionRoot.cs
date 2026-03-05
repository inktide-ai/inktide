using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.AI.Orchestrator.Core;

/// <summary>
/// DryIoc composition root that invokes all discovered <see cref="IServiceRegistrator"/> implementations.
/// </summary>
public sealed class ServiceRegistratorsCompositionRoot
{
    public ServiceRegistratorsCompositionRoot(
        IRegistrator registrator,
        IEnumerable<IServiceRegistrator>? serviceRegistrators,
        IConfiguration configuration)
    {
        foreach (var serviceRegistrator in serviceRegistrators ?? Enumerable.Empty<IServiceRegistrator>())
        {
            serviceRegistrator?.Register(registrator, configuration);
        }
    }
}
