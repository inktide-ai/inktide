using Inktide.API.Core;
using Inktide.API.Core.DependencyInjection;
using Inktide.API.Core.Settings;
using Inktide.API.Core.Settings.Validators;
using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Infrastructure.Adapters;
using Inktide.API.Synapse.Infrastructure.Aggregation;
using Inktide.API.Synapse.Infrastructure.ChannelContext;
using Inktide.API.Synapse.Infrastructure.Emotion;
using Inktide.API.Synapse.Infrastructure.Messaging;
using Inktide.API.Synapse.Infrastructure.Providers;
using Inktide.API.Synapse.Infrastructure.Llm;
using Inktide.API.Synapse.Infrastructure.Llm.Sections;
using Inktide.API.Synapse.Infrastructure.Autonomy;
using Inktide.API.Synapse.Infrastructure.Scattering;
using Inktide.API.Synapse.Infrastructure.Session;
using Inktide.API.Synapse.Infrastructure.Startup;
using Microsoft.Extensions.DependencyInjection;
using SoulRuntimeImpl = Inktide.API.Synapse.Infrastructure.SoulRuntime.SoulRuntime;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;

namespace Inktide.API.Synapse.Infrastructure;

/// <summary>
/// Registers Synapse infrastructure:
/// - Redis stream consumer + scatter-gather pipeline
/// - Semantic Kernel with all configured LLM providers (one IChatCompletionService per provider)
/// - LlmStreamWorker (replaces Python llm-worker)
/// </summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        // ---------------------------------------------------------------
        // Ingest stream settings
        // ---------------------------------------------------------------
        services.AddOptions<SynapseIngestStreamSettings>()
            .BindConfiguration(nameof(SynapseIngestStreamSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<SynapseIngestStreamSettings>, SynapseIngestStreamSettingsValidator>();

        services.AddSingleton<IChatMessageProcessor, ChatMessageProcessor>();
        services.AddSingleton<RedisStreamConnectionMonitor>();
        services.AddSingleton<RedisConsumerGroupInitializer>();
        services.AddSingleton<RedisStreamAutoClaimer>();
        services.AddHostedService<ChatMessageStreamConsumer>();

        services.AddOptions<SynapseAggregationOptions>()
            .BindConfiguration(SynapseAggregationOptions.SectionName);

        services.AddMemoryCache();

        services.AddSingleton<IConversationHistoryRepository, RedisConversationHistoryRepository>();

        // ── ACL adapters — port contracts owned by Synapse, implemented here ─────
        services.AddScoped<IRagQueryPort, MemoryRagAdapter>();
        services.AddScoped<IMemoryIngestionPort, MemoryIngestionAdapter>();
        services.AddScoped<IGraphPluginEnrichmentPort, GraphPluginEnrichmentAdapter>();
        services.AddScoped<ILlmCredentialPort, LlmCredentialAdapter>();
        services.AddScoped<ISynapseStatsPort, SynapseStatsAdapter>();

        services.AddSingleton<ChannelContextCache>();
        services.AddScoped<IChannelContextResolutionService, ChannelContextResolutionService>();
        services.AddScoped<IPipelineStage, RagScatterShard>();
        services.AddScoped<IPipelineStage, SessionScatterShard>();
        services.AddScoped<IPipelineStage, EmotionScatterShard>();
        services.AddScoped<IPipelineStage, ScreenContextScatterShard>();
        services.AddHttpClient<WebhookScatterShard>();
        services.AddScoped<IPipelineStage, WebhookScatterShard>();
        services.AddScoped<ISynapseAggregationService, SynapseAggregationService>();
        services.AddScoped<ISoulRuntime, SoulRuntimeImpl>();
        services.AddScoped<ISynapseIngestOrchestrator, SynapseIngestOrchestrator>();

        // ---------------------------------------------------------------
        // Emotion classification (OCP: remove EmotionScatterShard above to disable)
        // ---------------------------------------------------------------
        services.AddOptions<EmotionClassificationOptions>()
            .BindConfiguration(EmotionClassificationOptions.SectionName);

        services.AddHttpClient<OllamaEmotionClassifier>();
        services.AddSingleton<IEmotionClassificationService, OllamaEmotionClassifier>();
        services.AddSingleton<IEmotionClassifier>(sp =>
            sp.GetRequiredService<IEmotionClassificationService>() as IEmotionClassifier
                ?? throw new InvalidOperationException(
                    "IEmotionClassificationService implementation must also implement IEmotionClassifier."));
        services.AddSingleton<IEmotionalStateService, RedisEmotionalStateService>();

        // ---------------------------------------------------------------
        // Idle event dispatcher — autonomous speech driven by SoulState
        // ---------------------------------------------------------------
        services.AddSingleton<IdleEventDispatcher>();
        services.AddSingleton<IIdleActivityTracker>(sp => sp.GetRequiredService<IdleEventDispatcher>());
        services.AddHostedService(sp => sp.GetRequiredService<IdleEventDispatcher>());

        // OllamaChatProvider stays for ListModelsAsync (model catalog REST endpoint).
        // LLM inference is now handled by LlmStreamWorker via Semantic Kernel.
        services.AddHttpClient<OllamaChatProvider>();
        services.AddSingleton<OllamaChatProvider>();

        services.AddInktideChatProviders(ctx.Configuration, (sp, list) =>
        {
            list.Add(sp.GetRequiredService<OllamaChatProvider>());
        });

        // ---------------------------------------------------------------
        // LLM stream settings
        // ---------------------------------------------------------------
        services.AddOptions<LlmStreamSettings>()
            .BindConfiguration(LlmStreamSettings.SectionName);

        services.AddOptions<LlmProvidersSettings>()
            .BindConfiguration(LlmProvidersSettings.SectionName);

        // ---------------------------------------------------------------
        // Semantic Kernel — registered as Singleton via factory so we can
        // read LlmProvidersSettings through IOptions (avoids needing the
        // Microsoft.Extensions.Configuration.Binder package at startup).
        // Each enabled provider gets its own IChatCompletionService keyed
        // by providerId (== LlmCatalogEntry.Provider on the AiCard).
        // ---------------------------------------------------------------
        services.AddSingleton(sp =>
        {
            var opts = sp.GetRequiredService<IOptions<LlmProvidersSettings>>().Value;
            var builder = Kernel.CreateBuilder();

            foreach (var pair in opts.Providers)
            {
                var providerId = pair.Key;
                var cfg        = pair.Value;

                if (!cfg.IsEnabled) continue;

                var type = (cfg.ProviderType ?? "openai-compat").ToLowerInvariant();

                switch (type)
                {
                    case "azure-openai":
                        builder.AddAzureOpenAIChatCompletion(
                            deploymentName: cfg.AzureDeploymentName ?? cfg.FallbackModel,
                            endpoint:       cfg.BaseUrl!,
                            apiKey:         cfg.ApiKey!,
                            serviceId:      providerId);
                        break;

                    default:
                        // "openai-compat" — covers Ollama (/v1), OpenAI, OpenRouter, Groq,
                        // DeepSeek, LM Studio, Fireworks, Together, and any other /v1 provider.
                        if (cfg.BaseUrl is not null)
                        {
                            builder.AddOpenAIChatCompletion(
                                modelId:   cfg.FallbackModel,
                                endpoint:  new Uri(cfg.BaseUrl),
                                apiKey:    cfg.ApiKey,
                                serviceId: providerId);
                        }
                        else
                        {
                            builder.AddOpenAIChatCompletion(
                                modelId:   cfg.FallbackModel,
                                apiKey:    cfg.ApiKey ?? "no-key",
                                serviceId: providerId);
                        }
                        break;
                }
            }

            return builder.Build();
        });

        // ---------------------------------------------------------------
        // Chat service factory registry (Strategy pattern — OCP).
        // To add a new LLM provider: implement IChatServiceFactory and
        // add another AddSingleton line below. Nothing else changes.
        // ---------------------------------------------------------------
        services.AddSingleton<IChatServiceFactory, OpenAiCompatChatServiceFactory>();
        services.AddSingleton<ChatServiceFactoryRegistry>();

        services.AddHostedService<ScatterShardValidator>();

        // ---------------------------------------------------------------
        // Prompt builder — sections registered in order; new section = new AddSingleton line.
        // ---------------------------------------------------------------
        services.AddSingleton<IPromptSection, RagContextSection>();
        services.AddSingleton<IPromptSection, PersonalitySection>();
        services.AddSingleton<IPromptSection, EmotionSection>();
        services.AddSingleton<IPromptSection, AutonomousIdleSection>();
        services.AddSingleton<IPromptSection, ScreenAwarenessSection>();
        services.AddSingleton<IPromptSection, WebhookContextSection>();
        services.AddSingleton<SynapsePromptBuilder>();

        // ---------------------------------------------------------------
        // LLM stream worker (replaces Python llm-worker)
        // ---------------------------------------------------------------
        services.AddHostedService<LlmStreamWorker>();
    }
}
