using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.Grpc.Auth.Services;

namespace Chimera.Identity.API.Grpc.Auth.Application;

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
