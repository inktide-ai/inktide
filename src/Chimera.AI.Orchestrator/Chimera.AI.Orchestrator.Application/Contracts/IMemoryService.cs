using Chimera.AI.Orchestrator.Application.Models;

namespace Chimera.AI.Orchestrator.Application.Contracts;

/// <summary>
/// Stores and retrieves vector memories (past interactions, summaries).
/// Backed by a vector database (e.g. Qdrant).
/// </summary>
public interface IMemoryService
{
    /// <summary>
    /// Search for memories semantically similar to the given vector.
    /// Optionally filter by viewer, platform, channel, or memory type.
    /// </summary>
    Task<IReadOnlyList<MemoryFragment>> SearchAsync(
        float[] queryVector,
        string? viewerId = null,
        string? platform = null,
        string? channelId = null,
        MemoryType? type = null,
        int limit = 5,
        float scoreThreshold = 0.5f,
        CancellationToken ct = default);

    /// <summary>
    /// Store a new memory entry (message or summary) with its embedding.
    /// </summary>
    Task StoreAsync(MemoryEntry entry, CancellationToken ct = default);

    /// <summary>
    /// Delete all memories for a given viewer (GDPR, cleanup).
    /// </summary>
    Task DeleteByViewerAsync(string viewerId, string platform, CancellationToken ct = default);
}
