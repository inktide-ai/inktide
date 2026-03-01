using DryIoc;
using Microsoft.Extensions.Configuration;
using Chimera.ApiGateway.Application.Interfaces.Auth;
using Chimera.ApiGateway.Application.Interfaces.Email;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Domain.Repositories;
using Chimera.ApiGateway.Infrastructure.Auth;
using Chimera.ApiGateway.Infrastructure.Email;
using Chimera.ApiGateway.Infrastructure.Repositories;

namespace Chimera.ApiGateway.Infrastructure.DependencyInjection;

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
