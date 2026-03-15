using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Identify.Grpc.WebHost;

namespace Chimera.API.Identify.Grpc.DependencyInjection;

/// <summary>
/// Registers gRPC host services in DryIoc.
/// </summary>
public sealed class GrpcServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IWebHostConfigurator, GrpcWebHostConfigurator>(Reuse.Singleton);
    }
}
