namespace Inktide.API.TTS.Infrastructure.Silero;

/// <summary>
/// Where the Silero service (fast-api/ai-worker/tts/silero) listens. Bound from
/// <c>TtsProviders:Silero</c>; the provider is only registered when <see cref="Endpoint"/> is set.
/// </summary>
public sealed class SileroTtsSettings
{
    public const string SectionName = "TtsProviders:Silero";

    /// <summary>v1 API root, e.g. <c>http://silero:8000/v1</c>.</summary>
    public Uri? Endpoint { get; set; }

    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(1);
}
