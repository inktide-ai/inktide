using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.ApiGateway.Application.Interfaces.Auth;
using Chimera.ApiGateway.Application.Services;
using Chimera.ApiGateway.Core;

namespace Chimera.ApiGateway.Application.DependencyInjection;

/// <summary>Registers application-layer services into the DryIoc container.</summary>
public sealed class ApplicationServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IPasswordHasher, BCryptPasswordHasher>(Reuse.Singleton);
        registrator.Register<ITokenService, TokenService>(Reuse.Singleton);
        registrator.Register<IAuthService, AuthService>(Reuse.Scoped);
        registrator.Register<IPasswordResetService, PasswordResetService>(Reuse.Scoped);
    }

    #endregion
}
