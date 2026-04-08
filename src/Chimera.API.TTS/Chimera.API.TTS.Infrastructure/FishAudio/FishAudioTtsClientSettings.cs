namespace Chimera.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// Configuration for the Fish Audio HTTP client.
/// Bound from <c>TtsProviders:FishAudio</c>.
/// </summary>
public sealed class FishAudioTtsClientSettings
{
    public const string SectionName = "TtsProviders:FishAudio";

    /// <summary>
    /// Fish Audio API base URL. Defaults to <c>https://api.fish.audio</c>.
    /// Override for enterprise or on-premise deployments.
    /// </summary>
    public Uri Endpoint { get; set; } = new Uri("https://api.fish.audio");

    /// <summary>
    /// Default TTS model. Supported values: <c>s1</c>, <c>s2-pro</c>.
    /// Defaults to <c>s2-pro</c>.
    /// </summary>
    public string DefaultModel { get; set; } = "s2-pro";

    /// <summary>
    /// HTTP client timeout. Defaults to 3 minutes to accommodate long synthesis streams.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(3);

    /// <summary>
    /// Number of voices to fetch per page when listing voices.
    /// Defaults to <c>20</c>.
    /// </summary>
    public int VoiceListPageSize { get; set; } = 20;
}
