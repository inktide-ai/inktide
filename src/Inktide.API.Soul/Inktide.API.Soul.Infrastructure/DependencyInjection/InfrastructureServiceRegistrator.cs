using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.Connectors;
using Inktide.API.Soul.Infrastructure.Cache;
using Inktide.API.Soul.Infrastructure.Messaging;
using Inktide.API.Soul.Infrastructure.Queries;
using Inktide.API.Soul.Infrastructure.Repositories;
using Inktide.API.Soul.Infrastructure.Security;
using Inktide.API.Soul.Infrastructure.Services;
using Inktide.API.Soul.Infrastructure.Transactions;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Soul.Infrastructure.DependencyInjection;

public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IAiCardRepository, AiCardRepository>(Reuse.Scoped);
        registrator.Register<ICatalogRepository, CatalogRepository>(Reuse.Scoped);
        registrator.Register<IUsageDailyRepository, UsageDailyRepository>(Reuse.Scoped);
        registrator.Register<IAuditLogRepository, AuditLogRepository>(Reuse.Scoped);
        registrator.Register<IAiCardModelRepository, AiCardModelRepository>(Reuse.Scoped);
        registrator.Register<ISoulActivityFeedRepository, SoulActivityFeedRepository>(Reuse.Scoped);
        registrator.Register<IUserProviderCredentialRepository, UserProviderCredentialRepository>(Reuse.Scoped);
        registrator.Register<IApiKeyProtector, ApiKeyProtector>(Reuse.Scoped);
        registrator.Register<ICredentialTester, HttpCredentialTester>(Reuse.Scoped);
        registrator.Register<IAiCardChannelQueryService, AiCardChannelQueryService>(Reuse.Scoped);
        registrator.Register<IAiCardRunPresetQueryService, AiCardRunPresetQueryService>(Reuse.Scoped);
        registrator.Register<IMemoryStatsCache, RedisMemoryStatsCache>(Reuse.Scoped);
        registrator.Register<IDashboardStatsService, DashboardStatsService>(Reuse.Scoped);
        registrator.Register<IAiCardStatsService, AiCardStatsService>(Reuse.Scoped);
        registrator.Register<IProjectImportService, ProjectImportService>(Reuse.Scoped);
        registrator.Register<IProjectExportDataQuery, ProjectExportDataQueryService>(Reuse.Scoped);

        // Transaction infrastructure — scoped per request
        registrator.Register<IDomainEventCollector, DomainEventCollector>(Reuse.Scoped);
        registrator.Register<IDomainEventDispatcher, InMemoryDomainEventDispatcher>(Reuse.Scoped);
        registrator.Register<ITransactionManager, SoulTransactionManager>(Reuse.Scoped);

        // Integration event publisher — singleton, stateless Redis client
        registrator.Register<IIntegrationEventPublisher, RedisStreamsIntegrationEventPublisher>(Reuse.Singleton);

        // Synapse gate cache — singleton, Redis key per soul card
        registrator.Register<IAiCardStatusGateCache, SoulStatusGateRedisCache>(Reuse.Singleton);

        // Connector decoupling adapter — stub while AiCardChannel migrates to Project context
        registrator.Register<IConnectorChannelService, ConnectorChannelServiceAdapter>(Reuse.Scoped);
    }

}
