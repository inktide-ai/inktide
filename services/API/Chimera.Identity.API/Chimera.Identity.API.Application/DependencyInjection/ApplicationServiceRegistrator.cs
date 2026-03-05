using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Services;
using Chimera.Identity.API.Core;

namespace Chimera.Identity.Application.DependencyInjection;

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
