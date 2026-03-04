using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.Identity.API.Core;

/// <summary>
/// Composition root that invokes all discovered <see cref="IServiceRegistrator"/> implementations.
/// </summary>
public sealed class ServiceRegistratorsCompositionRoot
{
    #region Constructors

    /// <summary>
    /// Invokes each service registrator to populate the DryIoc container.
    /// </summary>
    /// <param name="registrator">The DryIoc registrator.</param>
    /// <param name="serviceRegistrators">Discovered service registrators.</param>
    /// <param name="configuration">Application configuration.</param>
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

    #endregion
}
