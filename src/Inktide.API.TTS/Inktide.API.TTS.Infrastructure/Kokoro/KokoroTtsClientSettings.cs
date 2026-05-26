using Inktide.API.Domain.Models;

namespace Inktide.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// App defaults for Kokoro; per-tenant URL usually comes from <see cref="ProviderOptions.Endpoint"/>.
/// </summary>
public sealed class KokoroTtsClientSettings
{
    public const string SectionName = "TtsProviders:Kokoro";

    /// <summary>
    /// Default v1 API root, e.g. <c>http://127.0.0.1:8880/v1/</c> (with or without trailing slash).
    /// </summary>
    public Uri? Endpoint { get; set; }

    /// <summary>
    /// HTTP client timeout for long-running synthesis requests. Default: 5 minutes.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(5);

}
