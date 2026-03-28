namespace Chimera.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port — PostgreSQL mirror of Qdrant vectors via <c>SoulDbContext.MemoryMetadata</c>.
/// Implementation lives in Memory.Infrastructure and uses Soul.Domain entity directly.
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
}
