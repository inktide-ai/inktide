using Chimera.API.Core;
using Chimera.API.Core.Settings;
using Chimera.API.Core.Settings.Validators;
using Chimera.API.Synapse.Application.Configuration;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Infrastructure.Aggregation;
using Chimera.API.Synapse.Infrastructure.ChannelContext;
using Chimera.API.Synapse.Infrastructure.Messaging;
using Chimera.API.Synapse.Infrastructure.Providers;
using Chimera.API.Synapse.Infrastructure.Scattering;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Chimera.API.Synapse.Infrastructure;

/// <summary>
/// Registers Synapse infrastructure (Redis stream consumer, event-driven scatter-gather, aggregation).
/// Scoped services are resolved per message via <see cref="ChatMessageStreamConsumer"/>.
/// </summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<SynapseIngestStreamSettings>()
            .BindConfiguration(nameof(SynapseIngestStreamSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<SynapseIngestStreamSettings>, SynapseIngestStreamSettingsValidator>();

        services.AddHostedService<ChatMessageStreamConsumer>();

        services.AddOptions<SynapseAggregationOptions>()
            .BindConfiguration(SynapseAggregationOptions.SectionName);

        services.AddMemoryCache();

        services.AddScoped<IChannelContextResolutionService, ChannelContextResolutionService>();
        /*services.AddScoped<ISynapseScatterShard, RagScatterShard>(); while useless*/
        services.AddScoped<ISynapseScatterShard, ContextScatterShard>();
        services.AddScoped<ISynapseAggregationService, SynapseAggregationService>();
        services.AddScoped<ISynapseIngestOrchestrator, SynapseIngestOrchestrator>();

        services.AddHttpClient<OllamaChatProvider>();
        services.AddSingleton<OllamaChatProvider>();
    }
}
