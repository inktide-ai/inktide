namespace Inktide.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port — maintenance operations for the memory store (expiry cleanup, diagnostics).
/// Separate from <see cref="IMemoryMetadataRepository"/> so ingestion/recall consumers are not
/// exposed to admin-only operations.
/// </summary>
public interface IMemoryMaintenanceRepository
{
    Task DeleteExpiredAsync(CancellationToken ct = default);

    Task<int> CountTotalAsync(CancellationToken ct = default);
}
