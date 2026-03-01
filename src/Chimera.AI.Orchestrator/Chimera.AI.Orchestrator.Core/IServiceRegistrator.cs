using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.AI.Orchestrator.Core;

/// <summary>
/// Register services directly into the DryIoc <see cref="IRegistrator"/>.
/// Use when DryIoc-specific features (decorators, delegate factories, Reuse) are needed.
/// </summary>
public interface IServiceRegistrator
{
    void Register(
        IRegistrator registrator,
        IConfiguration configuration);
}
