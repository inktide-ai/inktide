using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Core;

/// <summary>
/// Plugin contract for registering services into the DryIoc container (host-level composition root).
/// Implementations are discovered from loaded assemblies and invoked after the host's service collection is populated.
/// Use for types that must be resolved from DryIoc (e.g. App, custom factories).
/// </summary>
public interface IServiceRegistrator
{
    /// <summary>
    /// Registers services into the DryIoc container.
    /// </summary>
    /// <param name="registrator">The DryIoc registrator.</param>
    /// <param name="configuration">Application configuration (same as host).</param>
    void Register(IRegistrator registrator, IConfiguration configuration);
}
