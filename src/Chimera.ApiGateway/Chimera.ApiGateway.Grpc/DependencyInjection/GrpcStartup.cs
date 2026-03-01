using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Grpc.Interceptors;

namespace Chimera.ApiGateway.Grpc.DependencyInjection;

/// <summary>
/// Registers global gRPC services (AddGrpc, interceptors, etc.).
/// </summary>
public sealed class GrpcStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddGrpc(options =>
        {
            options.Interceptors.Add<GrpcExceptionInterceptor>();
        });
    }
}
