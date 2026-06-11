using System.Threading.Channels;
using Inktide.API.Core;
using Inktide.API.Core.DependencyInjection;
using Inktide.API.Memory.Application.Configuration.Validators;
using Inktide.API.Memory.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Inktide.API.Memory.Application.Configuration;
using Inktide.API.Memory.Application.Services;
using Inktide.API.Memory.Application.Workers;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.Clients;
using Inktide.API.Memory.Infrastructure.Ollama;
using Inktide.API.Memory.Infrastructure.Qdrant;
using Inktide.API.Memory.Application.Interfaces;
using Inktide.API.Memory.Infrastructure.Messaging;
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
        var connectionString = ctx.Configuration.GetConnectionString("Postgres")
            ?? BuildConnectionString(ctx.Configuration);
        services.AddDbContext<MemoryDbContext>(options => options.UseNpgsql(connectionString));

        services.Configure<MemoryOptions>(ctx.Configuration.GetSection(nameof(MemoryOptions)));
        services.AddSingleton<IValidateOptions<MemoryOptions>, MemoryOptionsValidator>();
        services.Configure<QdrantSettings>(ctx.Configuration.GetSection(nameof(QdrantSettings)));

        var qdrantSettings = ctx.Configuration
            .GetSection(nameof(QdrantSettings))
            .Get<QdrantSettings>() ?? new QdrantSettings();

        if (string.IsNullOrWhiteSpace(qdrantSettings.Host))
            throw new InvalidOperationException("QdrantSettings:Host is required but not configured.");
        if (qdrantSettings.GrpcPort is <= 0 or > 65535)
            throw new InvalidOperationException("QdrantSettings:GrpcPort must be a valid port (1–65535).");

        services.AddSingleton(_ => new QdrantClient(
            host: qdrantSettings.Host,
            port: qdrantSettings.GrpcPort));

        services.AddSingleton<IVectorMemoryRepository, QdrantMemoryRepository>();

        // Ensure soul.memory_metadata table exists (MemoryDbContext now owns it).
        services.AddHostedService<MemoryDbInitializer>();
        // Ensure the Qdrant collection exists on startup.
        services.AddHostedService<VectorCollectionInitializer>();

        var ollamaSettings = ctx.Configuration
            .GetSection(nameof(OllamaSettings))
            .Get<OllamaSettings>() ?? new OllamaSettings();

        if (string.IsNullOrWhiteSpace(ollamaSettings.Host))
            throw new InvalidOperationException("OllamaSettings:Host is required but not configured.");
        if (ollamaSettings.Port is <= 0 or > 65535)
            throw new InvalidOperationException("OllamaSettings:Port must be a valid port (1–65535).");

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

        services.AddHttpClient(ScribeFactExtractionClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var o = sp.GetRequiredService<IOptions<MemoryOptions>>().Value;
                client.BaseAddress = new Uri(o.ScribeBaseUrl);
                client.Timeout = TimeSpan.FromSeconds(60);
            })
            .AddInktideHttpResilience();

        services.AddSingleton<IFactExtractionClient, ScribeFactExtractionClient>();

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

        services.AddSingleton<IIngestionDlqPublisher, IngestionDlqPublisher>();
        services.AddSingleton<IMemoryIngestionService, MemoryIngestionService>();
        services.AddScoped<IMemoryQueryService, MemoryQueryService>();
        services.AddScoped<IMemoryIngestionPipeline, MemoryIngestionPipeline>();
        services.AddHostedService<MemoryIngestionWorker>();
        services.AddMemoryCache();
    }

    private static string BuildConnectionString(IConfiguration cfg)
    {
        var host     = cfg["PostgresSettings:Host"]     ?? "localhost";
        var port     = cfg["PostgresSettings:Port"]     ?? "5432";
        var db       = cfg["PostgresSettings:Database"] ?? "inktide";
        var username = cfg["PostgresSettings:Username"] ?? throw new InvalidOperationException("PostgresSettings:Username required");
        var password = cfg["PostgresSettings:Password"] ?? throw new InvalidOperationException("PostgresSettings:Password required");
        return $"Host={host};Port={port};Database={db};Username={username};Password={password}";
    }
}
