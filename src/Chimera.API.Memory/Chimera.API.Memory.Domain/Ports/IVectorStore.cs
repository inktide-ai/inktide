using Chimera.API.Memory.Domain.Models;

namespace Chimera.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port — vector database operations (Qdrant).
/// Tenant isolation is enforced by filtering on the <c>ai_card_id</c> payload field.
/// </summary>
public interface IVectorStore
{
    Task<IReadOnlyList<MemoryRecord>> SearchAsync(
        float[] queryVector,
        Guid aiCardId,
        int topK,
        CancellationToken ct = default);

    Task UpsertAsync(
        Guid pointId,
        float[] vector,
        string factText,
        Guid aiCardId,
        string category,
        double importance,
        DateTime rememberedAt,
        CancellationToken ct = default);

    Task DeleteByAiCardAsync(Guid aiCardId, CancellationToken ct = default);
}
