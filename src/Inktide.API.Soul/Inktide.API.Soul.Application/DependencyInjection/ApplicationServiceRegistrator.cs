using Inktide.API.Core;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Policies;
using Inktide.API.Soul.Application.Services;
using Inktide.API.Soul.Application.Storage;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Soul.Application.DependencyInjection;

public sealed class ApplicationServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        // Typed storage settings — injected as ObjectStorageSettings (not IConfiguration).
        // DIP: services depend on this value object, not on the framework's IConfiguration.
        var storageSettings = new ObjectStorageSettings();
        configuration.GetSection("S3Settings").Bind(storageSettings);
        registrator.RegisterInstance(storageSettings);

        // --- Core services ---
        registrator.Register<ISlugGenerator, DefaultSlugGenerator>(Reuse.Singleton);
        registrator.Register<IAiCardService, AiCardService>(Reuse.Scoped);
        registrator.Register<IAiCardActivityService, AiCardActivityService>(Reuse.Scoped);

        // --- Upload services ---
        registrator.Register<IAiCardAvatarService, AiCardAvatarService>(Reuse.Scoped);
        registrator.Register<IAiCardBannerService, AiCardBannerService>(Reuse.Scoped);

        // --- Model upload + retention policy ---
        // OCP: swap SingleActiveModelRetentionPolicy for another IModelRetentionPolicy — no other file changes.
        registrator.Register<IModelRetentionPolicy, SingleActiveModelRetentionPolicy>(Reuse.Scoped);
        registrator.Register<IAiCardModelUploadService, AiCardModelUploadService>(Reuse.Scoped);

        // --- Scene upload + tag management (ISP: two focused interfaces) ---
        registrator.Register<IAiCardSceneService, AiCardSceneUploadService>(Reuse.Scoped);
        registrator.Register<IAiCardSceneTagService, AiCardSceneTagService>(Reuse.Scoped);

        // --- Catalog ---
        registrator.Register<ICatalogService, CatalogService>(Reuse.Scoped);

        // --- Channel links ---
        registrator.Register<IAiCardChannelLinkService, AiCardChannelLinkService>(Reuse.Scoped);

        // --- BYOK provider credentials ---
        registrator.Register<IUserProviderCredentialService, UserProviderCredentialService>(Reuse.Scoped);
    }
}
