using Inktide.API.Core;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Application.ActivityFeed.Handlers;
using Inktide.API.Soul.Application.Guards;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Policies;
using Inktide.API.Soul.Application.Queries;
using Inktide.API.Soul.Application.Services;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Events;
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
        registrator.Register<IAiCardSlugService, AiCardSlugService>(Reuse.Singleton);
        registrator.Register<IAiCardService, AiCardService>(Reuse.Scoped);
        registrator.Register<SoulCreationValidationQueryService>(Reuse.Scoped);
        registrator.Register<SoulCreationGuard>(Reuse.Scoped);
        registrator.Register<IAiCardActivityService, AiCardActivityService>(Reuse.Scoped);
        registrator.Register<ISoulActivityFeedService, SoulActivityFeedService>(Reuse.Scoped);

        // Activity feed domain event handlers — resolved by InMemoryDomainEventDispatcher via IServiceProvider.GetServices
        registrator.Register<IDomainEventHandler<AiCardMoodShiftedEvent>,      MoodShiftFeedHandler>(Reuse.Scoped);
        registrator.Register<IDomainEventHandler<AiCardAppearanceChangedEvent>, AppearanceChangeFeedHandler>(Reuse.Scoped);
        registrator.Register<IDomainEventHandler<AiCardMilestoneReachedEvent>,  MilestoneFeedHandler>(Reuse.Scoped);
        registrator.Register<IDomainEventHandler<AiCardKnowledgeGainedEvent>,   KnowledgeGainedFeedHandler>(Reuse.Scoped);
        registrator.Register<IDomainEventHandler<AiCardPersonalityDriftedEvent>,PersonalityDriftFeedHandler>(Reuse.Scoped);

        // --- Upload services ---
        registrator.Register<IAiCardAvatarService, AiCardAvatarService>(Reuse.Scoped);
        registrator.Register<IAiCardBannerService, AiCardBannerService>(Reuse.Scoped);

        // --- Model upload + retention policy ---
        // OCP: NoOpModelRetentionPolicy keeps all models; active selection managed via SetActiveAsync.
        // Swap back to SingleActiveModelRetentionPolicy to restore one-model-per-card behavior.
        registrator.Register<IModelRetentionPolicy, NoOpModelRetentionPolicy>(Reuse.Scoped);
        registrator.Register<IAiCardModelUploadService, AiCardModelUploadService>(Reuse.Scoped);

        // --- Scene upload + tag management (ISP: two focused interfaces) ---
        registrator.Register<IAiCardSceneService, AiCardSceneUploadService>(Reuse.Scoped);
        registrator.Register<IAiCardSceneTagService, AiCardSceneTagService>(Reuse.Scoped);

        // --- Catalog ---
        registrator.Register<ICatalogService, CatalogService>(Reuse.Scoped);

        // --- Channel links (ISP: three focused interfaces, one scoped instance via RegisterMapping) ---
        registrator.Register<AiCardChannelLinkService>(Reuse.Scoped);
        registrator.RegisterMapping<IAiCardChannelCrudService, AiCardChannelLinkService>();
        registrator.RegisterMapping<IAiCardChannelLifecycleService, AiCardChannelLinkService>();
        registrator.RegisterMapping<IAiCardChannelConnectService, AiCardChannelLinkService>();

        // --- BYOK provider credentials ---
        registrator.Register<IUserProviderCredentialService, UserProviderCredentialService>(Reuse.Scoped);

        // --- Runtime presets (Scenes) ---
        registrator.Register<IAiCardRunPresetService, AiCardRunPresetService>(Reuse.Scoped);
    }
}
