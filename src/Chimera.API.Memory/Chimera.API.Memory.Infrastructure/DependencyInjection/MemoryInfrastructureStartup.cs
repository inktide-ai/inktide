using System.Threading.Channels;
using Chimera.API.Core;
using Chimera.API.Core.DependencyInjection;
using Chimera.API.Memory.Application.Configuration;
using Chimera.API.Memory.Application.Services;
using Chimera.API.Memory.Application.Workers;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Chimera.API.Memory.Infrastructure.Clients;
using Chimera.API.Memory.Infrastructure.Qdrant;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Qdrant.Client;

namespace Chimera.API.Memory.Infrastructure.DependencyInjection;

/// <summary>
/// Registers all Memory module services into MS DI (discovered via <see cref="IStartup"/>).
/// Scoped services (<see cref="IMemoryMetadataRepository"/>) are registered in
/// <see cref="MemoryServiceRegistrator"/> via DryIoc.
/// </summary>
public sealed class MemoryInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        // ── Options ──────────────────────────────────────────────────────────
        services.Configure<MemoryOptions>(ctx.Configuration.GetSection(MemoryOptions.SectionName));
        services.Configure<QdrantSettings>(ctx.Configuration.GetSection(QdrantSettings.SectionName));

        // ── Qdrant gRPC client ───────────────────────────────────────────────
        services.AddSingleton<QdrantClient>(sp =>
        {
            var s = sp.GetRequiredService<IOptions<QdrantSettings>>().Value;
            return new QdrantClient(s.Host, s.GrpcPort);
        });
        services.AddSingleton<IVectorStore, QdrantVectorStore>();

        // ── Scribe HTTP clients (embedding + fact extraction) ────────────────
        services.AddHttpClient(ScribeEmbeddingClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
                client.BaseAddress = new Uri(o.ScribeBaseUrl);
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .AddChimeraHttpResilience();

        services.AddHttpClient(ScribeFactExtractionClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
                client.BaseAddress = new Uri(o.ScribeBaseUrl);
                client.Timeout = TimeSpan.FromSeconds(60);
            })
            .AddChimeraHttpResilience();

        services.AddSingleton<IEmbeddingClient, ScribeEmbeddingClient>();
        services.AddSingleton<IFactExtractionClient, ScribeFactExtractionClient>();

        // ── Ingestion channel (bounded, drops oldest on overflow) ────────────
        services.AddSingleton(sp =>
        {
            var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
            return Channel.CreateBounded<MemoryIngestionJob>(
                new BoundedChannelOptions(o.IngestionChannelCapacity)
                {
                    FullMode = BoundedChannelFullMode.DropOldest,
                    SingleReader = true,
                    SingleWriter = false
                });
        });

        // ── Application services ─────────────────────────────────────────────
        services.AddSingleton<IMemoryIngestionService, MemoryIngestionService>();
        // Scoped: depends on IMemoryMetadataRepository (Scoped / SoulDbContext) — must not be Singleton.
        services.AddScoped<IMemoryQueryService, MemoryQueryService>();
        services.AddHostedService<MemoryIngestionWorker>();
        services.AddMemoryCache();
    }
}
