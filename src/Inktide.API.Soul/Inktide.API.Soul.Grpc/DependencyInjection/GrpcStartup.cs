using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Inktide.API.Core;
using Inktide.API.Soul.Grpc.Interceptors;

namespace Inktide.API.Soul.Grpc.DependencyInjection;

/// <summary>
/// Registers global gRPC services for the Soul module:
/// AddGrpc with the exception interceptor.
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
