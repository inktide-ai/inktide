using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Chimera.AI.Orchestrator.Application.Contracts;
using Chimera.AI.Orchestrator.Core;
using Chimera.AI.Orchestrator.Infrastructure.Messaging;
using Chimera.AI.Orchestrator.Infrastructure.Ollama;
using Chimera.AI.Orchestrator.Infrastructure.Qdrant;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.DependencyInjection;

/// <summary>
/// Registers RAG pipeline services: embedding provider, memory store, and the enriched message handler.
/// </summary>
public sealed class RagStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<OllamaSettings>()
            .BindConfiguration(nameof(OllamaSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<QdrantSettings>()
            .BindConfiguration(nameof(QdrantSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddHttpClient<IEmbeddingProvider, OllamaEmbeddingProvider>();

        services.AddSingleton<IMemoryService, QdrantMemoryService>();

        services.AddSingleton<IChatMessageHandler, RagEnrichedMessageHandler>();
    }
}
