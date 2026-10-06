namespace Inktide.API.Soul.Application.Storage;

/// <summary>
/// Chunk sizes for resumable uploads. Public because the REST layer needs them as constants
/// for <c>[RequestSizeLimit]</c>.
/// </summary>
public static class ChunkedUploadLimits
{
    /// <summary>
    /// What the client is told to send per request. Some VPN tunnels reset a single connection
    /// after roughly 2 MB, so a chunk has to finish well before that.
    /// </summary>
    public const int ChunkBytes = 1_048_576;

    /// <summary>Hard cap per request; leaves room for a client that rounds its chunk size up.</summary>
    public const long MaxChunkBytes = 2_097_152;
}
