using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.Grpc.Auth.Services;

namespace Chimera.Identity.API.Grpc.Auth.DependencyInjection;

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
