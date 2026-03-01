using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Grpc.WebHost;

namespace Chimera.ApiGateway.Grpc.DependencyInjection;

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
