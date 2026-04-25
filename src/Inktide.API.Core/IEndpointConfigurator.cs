using Microsoft.AspNetCore.Routing;

namespace Inktide.API.Core;

/// <summary>
/// Maps endpoints (controllers, gRPC services, health checks, etc.).
/// All implementations are called inside a single UseEndpoints() block — order does not matter.
/// </summary>
public interface IEndpointConfigurator
{
    /// <summary>
    /// Maps endpoints to the route builder.
    /// </summary>
    void Map(IEndpointRouteBuilder endpoints);
}
