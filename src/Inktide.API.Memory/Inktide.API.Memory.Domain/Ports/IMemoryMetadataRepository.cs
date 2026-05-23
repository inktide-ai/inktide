namespace Inktide.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port — PostgreSQL mirror of Qdrant vectors, owned by the Memory bounded context.
/// </summary>
public interface IMemoryMetadataRepository
{
    Task UpsertAsync(
        Guid aiCardId,
        string qdrantPointId,
        string factText,
        string category,
        string sourceType,
        double importance,
        DateTime rememberedAt,
        DateTime? expiresAt,
        CancellationToken ct = default);

    Task UpdateRecallAsync(
        Guid aiCardId,
        IReadOnlyList<Guid> qdrantPointIds,
        CancellationToken ct = default);

    Task DeleteExpiredAsync(CancellationToken ct = default);

    Task<int> CountTotalAsync(CancellationToken ct = default);
}
