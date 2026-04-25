using DryIoc;
using Microsoft.Extensions.Configuration;
using Inktide.API.Core;
using Inktide.API.Soul.Grpc.WebHost;

namespace Inktide.API.Soul.Grpc.DependencyInjection;

/// <summary>
/// Registers the Soul gRPC web-host configurator in DryIoc.
/// </summary>
public sealed class GrpcServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IWebHostConfigurator, GrpcWebHostConfigurator>(Reuse.Singleton);
    }

}
