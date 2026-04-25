namespace Inktide.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// Validates <c>/v1/download/{filename}</c> path segments (no traversal).
/// </summary>
internal static class KokoroDownloadFilename
{

    internal static string Sanitize(string filename)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filename);

        var trimmed = filename.Trim();
        if (trimmed.Length == 0)
        {
            throw new ArgumentException("filename is empty.", nameof(filename));
        }

        if (trimmed.IndexOfAny(['/', '\\']) >= 0)
        {
            throw new ArgumentException("filename must not contain path separators.", nameof(filename));
        }

        if (trimmed.Contains("..", StringComparison.Ordinal))
        {
            throw new ArgumentException("invalid filename.", nameof(filename));
        }

        return trimmed;
    }

}
