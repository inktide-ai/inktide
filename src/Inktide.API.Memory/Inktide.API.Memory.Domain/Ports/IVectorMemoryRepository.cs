using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port for vector storage. Implemented in Infrastructure (Qdrant).
/// Application layer depends only on this interface — no Qdrant SDK imports required.
/// </summary>
public interface IVectorMemoryRepository
{
    Task UpsertAsync(VectorUpsertRequest request, CancellationToken ct = default);

    Task UpsertBatchAsync(IReadOnlyList<VectorUpsertRequest> requests, CancellationToken ct = default);

    Task<IReadOnlyList<MemoryRecord>> SearchAsync(
        ReadOnlyMemory<float> vector,
        Guid aiCardId,
        int topK,
        CancellationToken ct = default);
}
