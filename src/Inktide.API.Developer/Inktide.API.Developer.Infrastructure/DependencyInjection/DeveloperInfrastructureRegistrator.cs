using DryIoc;
using Inktide.API.Core;
using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Domain.Repositories;
using Inktide.API.Developer.Infrastructure.Repositories;
using Inktide.API.Developer.Infrastructure.Services;
using Inktide.API.Developer.Infrastructure.Settings;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Developer.Infrastructure.DependencyInjection;

public sealed class DeveloperInfrastructureRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        // Settings
        var devSettings = new DeveloperSettings();
        configuration.GetSection(nameof(DeveloperSettings)).Bind(devSettings);
        registrator.RegisterInstance(devSettings);

        var kcSettings = new DeveloperKeycloakSettings();
        configuration.GetSection("KeycloakAdminSettings").Bind(kcSettings);
        registrator.RegisterInstance<DeveloperKeycloakSettings>(kcSettings);

        // Repositories
        registrator.Register<IDeveloperApplicationRepository, EfDeveloperApplicationRepository>(Reuse.Scoped);
        registrator.Register<IWebhookDeliveryRepository, EfWebhookDeliveryRepository>(Reuse.Scoped);

        // Services
        registrator.Register<IKeycloakClientService, KeycloakClientService>(Reuse.Singleton);
        registrator.Register<IDeveloperAppService, DeveloperAppService>(Reuse.Scoped);
        registrator.Register<IWebhookDispatchService, WebhookDispatchService>(Reuse.Scoped);
    }
}
