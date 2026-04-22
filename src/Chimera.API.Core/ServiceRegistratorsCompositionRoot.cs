using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Core;

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
