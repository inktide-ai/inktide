using DryIoc;
using Microsoft.Extensions.Configuration;
using Inktide.API.Core;
using Inktide.API.Soul.Grpc.AiCards.Service.Application;
using Inktide.API.Soul.Grpc.AiCards.Service.Services;

namespace Inktide.API.Soul.Grpc.AiCards.Service.DependencyInjection;

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
