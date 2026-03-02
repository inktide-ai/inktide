using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.ApiGateway.Core;

namespace Chimera.ApiGateway.REST.API;

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
