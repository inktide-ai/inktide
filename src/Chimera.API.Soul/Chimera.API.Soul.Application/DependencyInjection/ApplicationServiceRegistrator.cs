using Chimera.API.Core;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Services;
using Chimera.API.Soul.Application.Storage;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Soul.Application.DependencyInjection;

public sealed class ApplicationServiceRegistrator : IServiceRegistrator
{
    #region Public Methods

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        var storageSettings = new ObjectStorageSettings();
        configuration.GetSection("S3Settings").Bind(storageSettings);
        registrator.RegisterInstance(storageSettings);

        registrator.Register<IAiCardService, AiCardService>(Reuse.Scoped);
        registrator.Register<IAiCardAvatarService, AiCardAvatarService>(Reuse.Scoped);
        registrator.Register<ICatalogService, CatalogService>(Reuse.Scoped);
        registrator.Register<IAiCardChannelLinkService, AiCardChannelLinkService>(Reuse.Scoped);
        registrator.Register<IAiCardModelUploadService, AiCardModelUploadService>(Reuse.Scoped);
        registrator.Register<IAiCardSceneUploadService, AiCardSceneUploadService>(Reuse.Scoped);
    }

    #endregion
}
