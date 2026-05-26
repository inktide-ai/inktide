using Inktide.API.Core.Generators;
using Inktide.API.Memory.Application.Configuration;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Memory.Application.Services;

public sealed class MemoryIngestionPipeline : IMemoryIngestionPipeline
{
    private readonly IFactExtractionClient _scribe;
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embedder;
    private readonly IVectorMemoryRepository _vectorRepo;
    private readonly IMemoryMetadataRepository _metaRepo;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryIngestionPipeline> _logger;

    public MemoryIngestionPipeline(
        IFactExtractionClient scribe,
        IEmbeddingGenerator<string, Embedding<float>> embedder,
        IVectorMemoryRepository vectorRepo,
        IMemoryMetadataRepository metaRepo,
        IOptions<MemoryOptions> options,
        ILogger<MemoryIngestionPipeline> logger)
    {
        _scribe     = scribe     ?? throw new ArgumentNullException(nameof(scribe));
        _embedder   = embedder   ?? throw new ArgumentNullException(nameof(embedder));
        _vectorRepo = vectorRepo ?? throw new ArgumentNullException(nameof(vectorRepo));
        _metaRepo   = metaRepo   ?? throw new ArgumentNullException(nameof(metaRepo));
        _options    = options    ?? throw new ArgumentNullException(nameof(options));
        _logger     = logger     ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(MemoryIngestionJob job, CancellationToken ct)
    {
        var opts     = _options.Value;
        var facts    = await _scribe.ExtractFactsAsync(job, ct);
        var eligible = facts.Where(f => f.Importance >= opts.MinImportanceThreshold).ToList();

        if (eligible.Count == 0) return;

        var texts      = eligible.Select(f => f.Text).ToList();
        var embeddings = await _embedder.GenerateAsync(texts, cancellationToken: ct);

        var rememberedAt   = DateTime.UtcNow;
        var expiresAt      = rememberedAt.AddDays(opts.RetentionDays);
        var vectorRequests = new List<VectorUpsertRequest>(eligible.Count);
        var records        = new List<MemoryMetadata>(eligible.Count);

        for (var i = 0; i < eligible.Count; i++)
        {
            var fact    = eligible[i];
            var pointId = IdGenerator.New();

            vectorRequests.Add(new VectorUpsertRequest(
                PointId:      pointId,
                AiCardId:     job.CharacterId,
                FactText:     fact.Text,
                Category:     fact.Type,
                Importance:   fact.Importance,
                RememberedAt: rememberedAt,
                Embedding:    embeddings[i].Vector));

            records.Add(new MemoryMetadata
            {
                Id            = pointId,
                CharacterId   = job.CharacterId,
                QdrantPointId = pointId.ToString(),
                FactText      = fact.Text,
                Category      = fact.Type,
                SourceType    = MemorySourceType.Chat,
                Importance    = fact.Importance,
                RememberedAt  = rememberedAt,
                ExpiresAt     = expiresAt,
            });
        }

        await _metaRepo.UpsertBatchAsync(records, ct);
        await _vectorRepo.UpsertBatchAsync(vectorRequests, ct);

        _logger.LogDebug(
            "MemoryIngestionPipeline: stored {Count} facts for card {CardId}",
            eligible.Count, job.CharacterId);
    }
}
