using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Chimera.API.Core;
using Chimera.API.Soul.Grpc.AiCards.Service.Services;

namespace Chimera.API.Soul.Grpc.AiCards.Service.Application;

/// <summary>
/// Maps the Soul AiCard gRPC service endpoint.
/// </summary>
public sealed class GrpcAiCardsEndpointConfigurator : IEndpointConfigurator
{
    #region Public Methods

    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGrpcService<AiCardsGrpcService>();
    }

    #endregion
}
