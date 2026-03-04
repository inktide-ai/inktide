using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.Grpc.WebHost;

namespace Chimera.Identity.API.Grpc.DependencyInjection;

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
