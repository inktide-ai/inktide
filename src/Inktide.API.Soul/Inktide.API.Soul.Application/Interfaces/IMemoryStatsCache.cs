namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Read-only view of Memory context statistics published via Redis.
/// DIP: Soul.Application depends on this abstraction; Soul.Infrastructure binds it to Redis.
/// Cross-context contract: Memory writes to the key on ingest/deletion; Soul reads it here.
/// </summary>
public interface IMemoryStatsCache
{
    Task<int> GetTotalCountAsync(CancellationToken ct = default);
}
