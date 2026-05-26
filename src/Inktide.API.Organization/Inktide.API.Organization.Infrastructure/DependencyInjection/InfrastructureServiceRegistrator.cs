using Inktide.API.Core;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Application.Options;
using Inktide.API.Organization.Application.Services;
using Inktide.API.Organization.Infrastructure.RateLimiting;
using Inktide.API.Organization.Infrastructure.Repositories;
using Inktide.API.Organization.Infrastructure.Services;
using Inktide.API.Organization.Infrastructure.Settings;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Organization.Infrastructure.DependencyInjection;

public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        var smtp = new OrganizationSmtpSettings();
        configuration.GetSection("SmtpSettings").Bind(smtp);
        registrator.RegisterInstance(smtp);

        var orgSettings = new OrganizationSettings();
        configuration.GetSection(nameof(OrganizationSettings)).Bind(orgSettings);
        registrator.RegisterInstance(orgSettings);
        registrator.RegisterInstance(new OrganizationInviteOptions(orgSettings.InviteExpiryDays));
        registrator.RegisterInstance<TimeProvider>(TimeProvider.System);

        registrator.Register<IOrganizationRepository, OrganizationRepository>(Reuse.Scoped);
        registrator.Register<IOrganizationMemberRepository, OrganizationMemberRepository>(Reuse.Scoped);
        registrator.Register<IOrganizationInviteRepository, OrganizationInviteRepository>(Reuse.Scoped);
        registrator.Register<IOrganizationInviteService, OrganizationInviteService>(Reuse.Scoped);
        registrator.Register<IOrganizationInviteEmailService, OrganizationInviteEmailService>(Reuse.Scoped);
        registrator.Register<IInviteAttemptTracker, RedisInviteAttemptTracker>(Reuse.Singleton);
    }
}
