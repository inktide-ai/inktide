using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Port for reading and writing screen event context used by the scatter shard.
/// Implemented by <c>RedisScreenContextRepository</c> in ScreenAwareness.Infrastructure.
/// </summary>
public interface IScreenContextRepository
{
    /// <summary>
    /// Returns recent screen events for the given character within the specified time window.
    /// Returns null when no events exist or all have expired.
    /// </summary>
    Task<ScreenContext?> GetRecentAsync(Guid characterId, TimeSpan window, CancellationToken ct = default);

    /// <summary>
    /// Appends a detected screen event to the context cache and the per-tenant audit stream.
    /// Prunes events older than 60s from the cache on each write.
    /// </summary>
    Task AppendEventAsync(Guid characterId, Guid tenantId, string eventRecordJson, CancellationToken ct = default);
}
