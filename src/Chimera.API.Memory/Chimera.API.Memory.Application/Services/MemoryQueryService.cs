using Chimera.API.Memory.Application.Configuration;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chimera.API.Memory.Application.Services;

public sealed class MemoryQueryService : IMemoryQueryService
{
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embedder;
    private readonly IVectorMemoryRepository _vectorRepo;
    private readonly IMemoryMetadataRepository _metaRepo;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryQueryService> _logger;

    public MemoryQueryService(
        IEmbeddingGenerator<string, Embedding<float>> embedder,
        IVectorMemoryRepository vectorRepo,
        IMemoryMetadataRepository metaRepo,
        IOptions<MemoryOptions> options,
        ILogger<MemoryQueryService> logger)
    {
        _embedder   = embedder   ?? throw new ArgumentNullException(nameof(embedder));
        _vectorRepo = vectorRepo ?? throw new ArgumentNullException(nameof(vectorRepo));
        _metaRepo   = metaRepo   ?? throw new ArgumentNullException(nameof(metaRepo));
        _options    = options    ?? throw new ArgumentNullException(nameof(options));
        _logger     = logger     ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<MemoryRecord>> QueryAsync(
        Guid aiCardId,
        string queryText,
        int topK = 5,
        CancellationToken ct = default)
    {
        var embeddings = await _embedder.GenerateAsync([queryText], cancellationToken: ct);
        var vector     = embeddings[0].Vector;

        var records = await _vectorRepo.SearchAsync(vector, aiCardId, topK, ct);

        if (records.Count > 0)
        {
            var pointIds = records.Select(r => r.PointId).ToList();
            _ = _metaRepo.UpdateRecallAsync(aiCardId, pointIds, CancellationToken.None)
                .ContinueWith(
                    t => _logger.LogWarning(t.Exception, "MemoryQueryService: recall update failed for card {CardId}", aiCardId),
                    TaskContinuationOptions.OnlyOnFaulted);
        }

        _logger.LogDebug("MemoryQueryService: retrieved {Count} memories for card {CardId}", records.Count, aiCardId);
        return records;
    }
}
