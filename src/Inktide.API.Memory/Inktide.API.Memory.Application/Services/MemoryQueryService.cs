using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Memory.Application.Services;

public sealed class MemoryQueryService : IMemoryQueryService
{
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embedder;
    private readonly IVectorMemoryRepository _vectorRepo;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MemoryQueryService> _logger;

    public MemoryQueryService(
        IEmbeddingGenerator<string, Embedding<float>> embedder,
        IVectorMemoryRepository vectorRepo,
        IServiceScopeFactory scopeFactory,
        ILogger<MemoryQueryService> logger)
    {
        _embedder     = embedder     ?? throw new ArgumentNullException(nameof(embedder));
        _vectorRepo   = vectorRepo   ?? throw new ArgumentNullException(nameof(vectorRepo));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
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
            _ = Task.Run(async () =>
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var repo = scope.ServiceProvider.GetRequiredService<IMemoryMetadataRepository>();
                try { await repo.UpdateRecallAsync(aiCardId, pointIds, CancellationToken.None); }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "MemoryQueryService: recall update failed for card {CardId}", aiCardId);
                }
            });
        }

        _logger.LogDebug("MemoryQueryService: retrieved {Count} memories for card {CardId}", records.Count, aiCardId);
        return records;
    }
}
