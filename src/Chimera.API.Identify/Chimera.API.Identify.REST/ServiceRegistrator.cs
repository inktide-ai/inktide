using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;

namespace Chimera.API.Identify.REST;

/// <summary>
/// Registers REST.API-specific services in DryIoc: application configurator and web host configurator.
/// </summary>
public sealed class ServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IWebHostConfigurator, WebHostConfigurator>(Reuse.Singleton);
    }
}
