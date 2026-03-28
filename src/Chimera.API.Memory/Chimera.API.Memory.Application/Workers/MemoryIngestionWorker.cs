using System.Threading.Channels;
using Chimera.API.Memory.Application.Configuration;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chimera.API.Memory.Application.Workers;

/// <summary>
/// Background service that drains the ingestion channel, batches jobs, and stores facts in Qdrant + PostgreSQL.
/// Batching strategy: flush when batch reaches <c>IngestionBatchSize</c> OR after <c>IngestionBatchWindowMs</c>.
/// </summary>
public sealed class MemoryIngestionWorker : BackgroundService
{
    private readonly Channel<MemoryIngestionJob> _channel;
    private readonly IFactExtractionClient _scribe;
    private readonly IEmbeddingClient _embedder;
    private readonly IVectorStore _vectorStore;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryIngestionWorker> _logger;

    public MemoryIngestionWorker(
        Channel<MemoryIngestionJob> channel,
        IFactExtractionClient scribe,
        IEmbeddingClient embedder,
        IVectorStore vectorStore,
        IServiceScopeFactory scopeFactory,
        IOptions<MemoryOptions> options,
        ILogger<MemoryIngestionWorker> logger)
    {
        _channel = channel;
        _scribe = scribe;
        _embedder = embedder;
        _vectorStore = vectorStore;
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MemoryIngestionWorker started");

        var batch = new List<MemoryIngestionJob>(_options.Value.IngestionBatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            batch.Clear();

            using var windowCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            windowCts.CancelAfter(_options.Value.IngestionBatchWindowMs);

            try
            {
                while (batch.Count < _options.Value.IngestionBatchSize)
                    batch.Add(await _channel.Reader.ReadAsync(windowCts.Token));
            }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
            {
                // batch window expired — flush whatever we have
            }
            catch (OperationCanceledException)
            {
                break; // host is shutting down
            }

            if (batch.Count > 0)
                await ProcessBatchAsync(batch, stoppingToken);
        }

        _logger.LogInformation("MemoryIngestionWorker stopped");
    }

    private async Task ProcessBatchAsync(IReadOnlyList<MemoryIngestionJob> batch, CancellationToken ct)
    {
        foreach (var job in batch)
        {
            try
            {
                await ProcessJobAsync(job, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "MemoryIngestionWorker: failed to process job for card {CardId}, channel {Channel}",
                    job.AiCardId, job.ChannelId);
            }
        }
    }

    private async Task ProcessJobAsync(MemoryIngestionJob job, CancellationToken ct)
    {
        var opts = _options.Value;

        var facts = await _scribe.ExtractFactsAsync(job, ct);
        var eligible = facts.Where(f => f.Importance >= opts.MinImportanceThreshold).ToList();

        if (eligible.Count == 0) return;

        var texts = eligible.Select(f => f.Text).ToList();
        var vectors = await _embedder.EmbedBatchAsync(texts, ct);

        var expiresAt = DateTime.UtcNow.AddDays(opts.RetentionDays);
        var rememberedAt = DateTime.UtcNow;

        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMemoryMetadataRepository>();

        for (var i = 0; i < eligible.Count; i++)
        {
            var fact = eligible[i];
            var pointId = Guid.NewGuid();

            await _vectorStore.UpsertAsync(
                pointId, vectors[i], fact.Text, job.AiCardId,
                fact.Type, fact.Importance, rememberedAt, ct);

            await repo.UpsertAsync(
                aiCardId: job.AiCardId,
                qdrantPointId: pointId.ToString(),
                factText: fact.Text,
                category: fact.Type,
                sourceType: "chat",
                importance: fact.Importance,
                rememberedAt: rememberedAt,
                expiresAt: expiresAt,
                ct: ct);
        }

        _logger.LogDebug(
            "MemoryIngestionWorker: stored {Count} facts for card {CardId}",
            eligible.Count, job.AiCardId);
    }
}
