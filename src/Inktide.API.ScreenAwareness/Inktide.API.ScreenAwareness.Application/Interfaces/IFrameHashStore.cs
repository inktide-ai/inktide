namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>
/// Stores and retrieves the last accepted pHash per streamer for scene deduplication.
/// Key: <c>screen:hash:{tenantId:N}:{streamerId:N}</c> with EX 3600.
/// </summary>
public interface IFrameHashStore
{
    /// <summary>
    /// Atomically replaces the stored hash with <paramref name="newHash"/> and returns the previous value.
    /// Returns <c>null</c> if no hash was stored yet (first frame for this streamer).
    /// </summary>
    Task<ulong?> AtomicGetAndSetAsync(Guid tenantId, Guid streamerId, ulong newHash, CancellationToken ct = default);
}
