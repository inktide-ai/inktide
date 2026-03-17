using Chimera.API.Core;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Services;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Soul.Application.DependencyInjection;

public sealed class ApplicationServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IAiCardService, AiCardService>(Reuse.Scoped);
        registrator.Register<ICatalogService, CatalogService>(Reuse.Scoped);
    }

    #endregion
}
