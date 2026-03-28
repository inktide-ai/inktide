using Chimera.API.Memory.Application.Configuration;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chimera.API.Memory.Application.Services;

public sealed class MemoryQueryService : IMemoryQueryService
{
    private readonly IEmbeddingClient _embedder;
    private readonly IVectorStore _vectorStore;
    private readonly IMemoryMetadataRepository _metaRepo;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryQueryService> _logger;

    public MemoryQueryService(
        IEmbeddingClient embedder,
        IVectorStore vectorStore,
        IMemoryMetadataRepository metaRepo,
        IOptions<MemoryOptions> options,
        ILogger<MemoryQueryService> logger)
    {
        _embedder = embedder;
        _vectorStore = vectorStore;
        _metaRepo = metaRepo;
        _options = options;
        _logger = logger;
    }

    public async Task<IReadOnlyList<MemoryRecord>> QueryAsync(
        Guid aiCardId,
        string queryText,
        int topK = 5,
        CancellationToken ct = default)
    {
        var vector = await _embedder.EmbedAsync(queryText, ct);
        var results = await _vectorStore.SearchAsync(vector, aiCardId, topK, ct);

        if (results.Count > 0)
        {
            // Fire-and-forget recall stat update — never blocks the pipeline
            var pointIds = results.Select(r => r.PointId).ToList();
            _ = _metaRepo.UpdateRecallAsync(aiCardId, pointIds, CancellationToken.None)
                .ContinueWith(
                    t => _logger.LogWarning(t.Exception, "MemoryQueryService: recall update failed for card {CardId}", aiCardId),
                    TaskContinuationOptions.OnlyOnFaulted);
        }

        _logger.LogDebug("MemoryQueryService: retrieved {Count} memories for card {CardId}", results.Count, aiCardId);
        return results;
    }
}
