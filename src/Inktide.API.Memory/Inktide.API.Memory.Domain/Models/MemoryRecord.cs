namespace Inktide.API.Memory.Domain.Models;

/// <summary>
/// Result of a Qdrant semantic search query — one retrieved memory fact.
/// </summary>
public sealed record MemoryRecord(
    Guid PointId,
    string FactText,
    string Category,
    double Importance,
    float Score,
    DateTime RememberedAt);
