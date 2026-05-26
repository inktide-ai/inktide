namespace Inktide.API.TTS.Application.Configuration;

/// <summary>
/// Settings for publishing synthesized audio to the <c>synapse.tts.ready</c> Redis stream,
/// consumed downstream by the Publisher Worker (Twitch / Discord output).
/// </summary>
public sealed class TtsOutputStreamSettings
{
    public const string SectionName = "TtsOutputStream";

    /// <summary>Redis stream key where audio payloads are published.
    /// Default matches <c>Inktide.API.Core.Constants.StreamNames.TtsReady</c>.</summary>
    public string StreamName { get; init; } = "synapse.tts.ready";

    /// <summary>Approximate MAXLEN (~N) to keep memory bounded.</summary>
    public int ApproximateMaxLength { get; init; } = 5_000;

    /// <summary>Stream entry field name holding the JSON payload.</summary>
    public string PayloadFieldName { get; init; } = "payload";
}
