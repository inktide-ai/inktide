namespace Chimera.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// Binary response from Kokoro (download, combine, or raw audio) with optional MIME type from upstream.
/// </summary>
public sealed class KokoroHttpStreamResult
{
    #region Properties

    /// <summary>
    /// Response body stream; caller must dispose (e.g. <c>await using</c>).
    /// </summary>
    public required Stream Stream { get; init; }

    public string? MediaType { get; init; }

    #endregion
}
