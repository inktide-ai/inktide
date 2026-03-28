using Chimera.API.Memory.Domain.Models;

namespace Chimera.API.Memory.Domain.Ports;

/// <summary>
/// Inbound port — embeds a query and retrieves the top-K semantically relevant memories for an AI card.
/// Called by the Synapse RAG scatter shard during event-driven aggregation.
/// </summary>
public interface IMemoryQueryService
{
    Task<IReadOnlyList<MemoryRecord>> QueryAsync(
        Guid aiCardId,
        string queryText,
        int topK = 5,
        CancellationToken ct = default);
}
