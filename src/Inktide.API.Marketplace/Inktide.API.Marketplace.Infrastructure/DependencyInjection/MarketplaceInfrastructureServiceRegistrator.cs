using Inktide.API.Core;
using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.Application.Services;
using Inktide.API.Marketplace.Domain.Repositories;
using Inktide.API.Marketplace.Infrastructure.Repositories;
using Inktide.API.Marketplace.Infrastructure.Services;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Marketplace.Infrastructure.DependencyInjection;

public sealed class MarketplaceInfrastructureServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IConnectorRepository,             EfConnectorRepository>(Reuse.Scoped);
        registrator.Register<IConnectorInstallationRepository, EfConnectorInstallationRepository>(Reuse.Scoped);
        registrator.Register<IMarketplaceService,              MarketplaceService>(Reuse.Scoped);
        registrator.Register<ISoulOwnershipChecker,            SoulOwnershipChecker>(Reuse.Scoped);
        registrator.Register<ICurrentUserTokenProvider,        HttpContextTokenProvider>(Reuse.Scoped);
    }
}
