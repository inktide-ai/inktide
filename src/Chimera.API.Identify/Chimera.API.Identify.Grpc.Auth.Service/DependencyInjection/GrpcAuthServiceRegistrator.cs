using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Identify.Grpc.Auth.Service.Services;

namespace Chimera.API.Identify.Grpc.Auth.Service.DependencyInjection;

/// <summary>Registers gRPC Auth module services in DryIoc.</summary>
public sealed class GrpcAuthServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        // Scoped: gRPC request context maps to a DI scope; avoids Captive Dependency issues.
        registrator.Register<AuthGrpcService>(Reuse.Scoped);
    }

    #endregion
}
