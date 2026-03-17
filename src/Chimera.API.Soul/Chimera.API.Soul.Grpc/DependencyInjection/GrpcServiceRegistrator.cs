using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Soul.Grpc.WebHost;

namespace Chimera.API.Soul.Grpc.DependencyInjection;

/// <summary>
/// Registers the Soul gRPC web-host configurator in DryIoc.
/// </summary>
public sealed class GrpcServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IWebHostConfigurator, GrpcWebHostConfigurator>(Reuse.Singleton);
    }

    #endregion
}
