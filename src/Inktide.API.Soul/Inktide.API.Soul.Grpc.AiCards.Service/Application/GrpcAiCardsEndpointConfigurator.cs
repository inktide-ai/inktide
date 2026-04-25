using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Inktide.API.Core;
using Inktide.API.Soul.Grpc.AiCards.Service.Services;

namespace Inktide.API.Soul.Grpc.AiCards.Service.Application;

/// <summary>
/// Maps the Soul AiCard gRPC service endpoint.
/// </summary>
public sealed class GrpcAiCardsEndpointConfigurator : IEndpointConfigurator
{

    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGrpcService<AiCardsGrpcService>();
    }

}
