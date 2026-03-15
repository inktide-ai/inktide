using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Chimera.API.Core;
using Chimera.API.Identify.Grpc.Auth.Service.Services;

namespace Chimera.API.Identify.Grpc.Auth.Service.Application;

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
