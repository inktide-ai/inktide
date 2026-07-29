using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port - PostgreSQL mirror of Qdrant vectors, owned by the Memory bounded context.
/// </summary>
public interface IMemoryMetadataRepository
{
    Task UpsertAsync(MemoryMetadata metadata, CancellationToken ct = default);

    Task UpsertBatchAsync(IReadOnlyList<MemoryMetadata> records, CancellationToken ct = default);

    Task UpdateRecallAsync(
        Guid aiCardId,
        IReadOnlyList<Guid> qdrantPointIds,
        CancellationToken ct = default);
}
