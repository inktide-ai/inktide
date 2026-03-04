using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Interfaces.Email;
using Chimera.Identity.API.Core;
using Chimera.Identity.Domain.Repositories;
using Chimera.Identity.Infrastructure.Auth;
using Chimera.Identity.Infrastructure.Email;
using Chimera.Identity.Infrastructure.Repositories;

namespace Chimera.Identity.Infrastructure.DependencyInjection;

/// <summary>Registers infrastructure layer (repositories, stores, email) into DryIoc.</summary>
public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IUserRepository, UserRepository>(Reuse.Scoped);

        // Singleton: stateless after construction — only depends on IConnectionMultiplexer (Singleton).
        registrator.Register<IRefreshTokenStore, RefreshTokenStore>(Reuse.Singleton);
        registrator.Register<IPasswordResetStore, PasswordResetStore>(Reuse.Singleton);

        registrator.Register<IEmailSender, SmtpEmailSender>(Reuse.Singleton);
    }

    #endregion
}
