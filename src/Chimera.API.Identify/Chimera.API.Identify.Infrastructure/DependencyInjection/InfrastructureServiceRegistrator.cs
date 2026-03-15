using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.API.Identify.Application.Interfaces.Auth;
using Chimera.API.Identify.Application.Interfaces.Email;
using Chimera.API.Core;
using Chimera.API.Identify.Domain.Repositories;
using Chimera.API.Identify.Infrastructure.Auth;
using Chimera.API.Identify.Infrastructure.Email;
using Chimera.API.Identify.Infrastructure.Repositories;

namespace Chimera.API.Identify.Infrastructure.DependencyInjection;

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
