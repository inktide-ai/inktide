using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Soul.Grpc.AiCards.Service.Application;
using Chimera.API.Soul.Grpc.AiCards.Service.Services;

namespace Chimera.API.Soul.Grpc.AiCards.Service.DependencyInjection;

/// <summary>
/// Registers Soul gRPC AiCards module services in DryIoc.
/// </summary>
public sealed class GrpcAiCardsServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        // Scoped: gRPC request context maps to a DI scope; avoids Captive Dependency issues.
        registrator.Register<AiCardsGrpcService>(Reuse.Scoped);
        registrator.Register<IEndpointConfigurator, GrpcAiCardsEndpointConfigurator>(Reuse.Singleton);
    }

}
