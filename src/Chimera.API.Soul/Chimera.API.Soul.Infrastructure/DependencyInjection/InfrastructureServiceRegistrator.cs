using Chimera.API.Core;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.Repositories;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Soul.Infrastructure.DependencyInjection;

public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IAiCardRepository, AiCardRepository>(Reuse.Scoped);
        registrator.Register<IAiCardChannelRepository, AiCardChannelRepository>(Reuse.Scoped);
        registrator.Register<ICatalogRepository, CatalogRepository>(Reuse.Scoped);
        registrator.Register<IUsageDailyRepository, UsageDailyRepository>(Reuse.Scoped);
        registrator.Register<IAuditLogRepository, AuditLogRepository>(Reuse.Scoped);
    }

    #endregion
}
