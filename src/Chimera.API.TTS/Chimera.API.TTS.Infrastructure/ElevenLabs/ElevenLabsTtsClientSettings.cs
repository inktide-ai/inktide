namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// Configuration for the ElevenLabs HTTP client.
/// Bound from <c>TtsProviders:ElevenLabs</c>.
/// </summary>
public sealed class ElevenLabsTtsClientSettings
{
    public const string SectionName = "TtsProviders:ElevenLabs";

    /// <summary>
    /// ElevenLabs API base URL. Defaults to <c>https://api.elevenlabs.io</c>.
    /// Override for enterprise or self-hosted deployments.
    /// </summary>
    public Uri Endpoint { get; set; } = new Uri("https://api.elevenlabs.io");

    /// <summary>
    /// HTTP client timeout. Defaults to 3 minutes to accommodate long synthesis streams.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(3);

}
