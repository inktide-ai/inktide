using System.Threading.Channels;
using Chimera.API.Memory.Application.Configuration;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
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
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embedder;
    private readonly IVectorMemoryRepository _vectorRepo;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryIngestionWorker> _logger;

    public MemoryIngestionWorker(
        Channel<MemoryIngestionJob> channel,
        IFactExtractionClient scribe,
        IEmbeddingGenerator<string, Embedding<float>> embedder,
        IVectorMemoryRepository vectorRepo,
        IServiceScopeFactory scopeFactory,
        IOptions<MemoryOptions> options,
        ILogger<MemoryIngestionWorker> logger)
    {
        _channel      = channel      ?? throw new ArgumentNullException(nameof(channel));
        _scribe       = scribe       ?? throw new ArgumentNullException(nameof(scribe));
        _embedder     = embedder     ?? throw new ArgumentNullException(nameof(embedder));
        _vectorRepo   = vectorRepo   ?? throw new ArgumentNullException(nameof(vectorRepo));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _options      = options      ?? throw new ArgumentNullException(nameof(options));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
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

        var facts    = await _scribe.ExtractFactsAsync(job, ct);
        var eligible = facts.Where(f => f.Importance >= opts.MinImportanceThreshold).ToList();

        if (eligible.Count == 0) return;

        var texts      = eligible.Select(f => f.Text).ToList();
        var embeddings = await _embedder.GenerateAsync(texts, cancellationToken: ct);

        var rememberedAt = DateTime.UtcNow;
        var expiresAt    = rememberedAt.AddDays(opts.RetentionDays);

        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMemoryMetadataRepository>();

        for (var i = 0; i < eligible.Count; i++)
        {
            var fact    = eligible[i];
            var pointId = Guid.NewGuid();

            await _vectorRepo.UpsertAsync(
                pointId:      pointId,
                aiCardId:     job.AiCardId,
                factText:     fact.Text,
                category:     fact.Type,
                importance:   fact.Importance,
                rememberedAt: rememberedAt,
                embedding:    embeddings[i].Vector,
                ct:           ct);

            await repo.UpsertAsync(
                aiCardId:      job.AiCardId,
                qdrantPointId: pointId.ToString(),
                factText:      fact.Text,
                category:      fact.Type,
                sourceType:    "chat",
                importance:    fact.Importance,
                rememberedAt:  rememberedAt,
                expiresAt:     expiresAt,
                ct:            ct);
        }

        _logger.LogDebug(
            "MemoryIngestionWorker: stored {Count} facts for card {CardId}",
            eligible.Count, job.AiCardId);
    }
}
