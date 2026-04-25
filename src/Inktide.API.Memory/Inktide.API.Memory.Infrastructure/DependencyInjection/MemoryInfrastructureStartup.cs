using System.Threading.Channels;
using Inktide.API.Core;
using Inktide.API.Core.DependencyInjection;
using Inktide.API.Memory.Application.Configuration;
using Inktide.API.Memory.Application.Services;
using Inktide.API.Memory.Application.Workers;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.Clients;
using Inktide.API.Memory.Infrastructure.Ollama;
using Inktide.API.Memory.Infrastructure.Qdrant;
using Inktide.API.Memory.Infrastructure.Workers;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using OpenAI;
using Qdrant.Client;
using System.ClientModel;

namespace Inktide.API.Memory.Infrastructure.DependencyInjection;

/// <summary>
/// Registers all Memory module services into MS DI (discovered via <see cref="IStartup"/>).
///
/// Vector store: Qdrant via direct Qdrant.Client SDK.
///   No SK VectorData abstractions — full Qdrant coupling by design.
///
/// Embeddings: Ollama via Microsoft.Extensions.AI + OpenAI compat endpoint (stable).
/// </summary>
public sealed class MemoryInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.Configure<MemoryOptions>(ctx.Configuration.GetSection(nameof(MemoryOptions)));
        services.Configure<QdrantSettings>(ctx.Configuration.GetSection(nameof(QdrantSettings)));

        // ── Qdrant (direct SDK — no SK VectorData) ───────────────────────────
        var qdrantSettings = ctx.Configuration
            .GetSection(nameof(QdrantSettings))
            .Get<QdrantSettings>() ?? new QdrantSettings();

        services.AddSingleton(_ => new QdrantClient(
            host: qdrantSettings.Host,
            port: qdrantSettings.GrpcPort));

        services.AddSingleton<IVectorMemoryRepository, QdrantMemoryRepository>();

        // Ensure the Qdrant collection exists on startup.
        services.AddHostedService<VectorCollectionInitializer>();

        // ── Embeddings (Ollama via OpenAI-compat + Microsoft.Extensions.AI) ──
        var ollamaSettings = ctx.Configuration
            .GetSection(nameof(OllamaSettings))
            .Get<OllamaSettings>() ?? new OllamaSettings();

        services.AddSingleton<IEmbeddingGenerator<string, Embedding<float>>>(sp =>
        {
            var client = new OpenAIClient(
                new ApiKeyCredential("ollama"),
                new OpenAIClientOptions
                {
                    Endpoint = new Uri($"{ollamaSettings.Host}:{ollamaSettings.Port}/v1"),
                });
            return client.GetEmbeddingClient(ollamaSettings.EmbeddingModel)
                         .AsIEmbeddingGenerator();
        });

        // ── Fact extraction (Scribe Python worker) ────────────────────────────
        services.AddHttpClient(ScribeFactExtractionClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
                client.BaseAddress = new Uri(o.ScribeBaseUrl);
                client.Timeout = TimeSpan.FromSeconds(60);
            })
            .AddInktideHttpResilience();

        services.AddSingleton<IFactExtractionClient, ScribeFactExtractionClient>();

        // ── Ingestion channel ─────────────────────────────────────────────────
        services.AddSingleton(sp =>
        {
            var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
            return Channel.CreateBounded<MemoryIngestionJob>(
                new BoundedChannelOptions(o.IngestionChannelCapacity)
                {
                    FullMode     = BoundedChannelFullMode.DropOldest,
                    SingleReader = true,
                    SingleWriter = false,
                });
        });

        services.AddSingleton<IMemoryIngestionService, MemoryIngestionService>();
        services.AddScoped<IMemoryQueryService, MemoryQueryService>();
        services.AddHostedService<MemoryIngestionWorker>();
        services.AddMemoryCache();
    }
}
