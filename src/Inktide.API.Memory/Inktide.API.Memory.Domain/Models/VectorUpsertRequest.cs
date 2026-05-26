namespace Inktide.API.Memory.Domain.Models;

public sealed record VectorUpsertRequest(
    Guid PointId,
    Guid AiCardId,
    string FactText,
    string Category,
    double Importance,
    DateTime RememberedAt,
    ReadOnlyMemory<float> Embedding);
