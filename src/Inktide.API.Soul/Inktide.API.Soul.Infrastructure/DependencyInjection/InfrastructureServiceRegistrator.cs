using Inktide.API.Core;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.Repositories;
using Inktide.API.Soul.Infrastructure.Security;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Soul.Infrastructure.DependencyInjection;

public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IAiCardRepository, AiCardRepository>(Reuse.Scoped);
        registrator.Register<IAiCardChannelRepository, AiCardChannelRepository>(Reuse.Scoped);
        registrator.Register<ICatalogRepository, CatalogRepository>(Reuse.Scoped);
        registrator.Register<IUsageDailyRepository, UsageDailyRepository>(Reuse.Scoped);
        registrator.Register<IAuditLogRepository, AuditLogRepository>(Reuse.Scoped);
        registrator.Register<IAiCardModelRepository, AiCardModelRepository>(Reuse.Scoped);
        registrator.Register<IAiCardSceneRepository, AiCardSceneRepository>(Reuse.Scoped);
        registrator.Register<IAiCardCustomSceneTagRepository, AiCardCustomSceneTagRepository>(Reuse.Scoped);
        registrator.Register<IUserProviderCredentialRepository, UserProviderCredentialRepository>(Reuse.Scoped);
        registrator.Register<IApiKeyProtector, ApiKeyProtector>(Reuse.Scoped);
    }

}
