using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Grpc.Auth.Services;

namespace Chimera.ApiGateway.Grpc.Auth.Application;

/// <summary>
/// Maps gRPC auth service endpoints.
/// </summary>
public sealed class GrpcAuthEndpointConfigurator : IEndpointConfigurator
{
    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGrpcService<AuthGrpcService>();
    }
}
