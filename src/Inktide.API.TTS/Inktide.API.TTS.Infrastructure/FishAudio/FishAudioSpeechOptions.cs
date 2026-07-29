using System.Text.Json.Serialization;

namespace Inktide.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// JSON body for <c>POST /v1/tts</c>.
/// </summary>
internal sealed class FishAudioSpeechOptions
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    /// <summary>Voice / model reference ID used for synthesis.</summary>
    [JsonPropertyName("reference_id")]
    public string ReferenceId { get; set; } = string.Empty;

    /// <summary>Output audio format: <c>mp3</c>, <c>opus</c>, <c>wav</c>, <c>pcm</c>.</summary>
    [JsonPropertyName("format")]
    public string Format { get; set; } = "mp3";

    /// <summary>Playback speed multiplier. Clamped to 0.5-2.0 by Fish Audio.</summary>
    [JsonPropertyName("speed")]
    public float Speed { get; set; } = 1.0f;

    /// <summary>
    /// Latency mode: <c>normal</c> (default, balanced quality) or <c>balanced</c> (faster TTFB).
    /// </summary>
    [JsonPropertyName("latency")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Latency { get; set; }

    /// <summary>Normalise text before synthesis. Defaults to <c>true</c>.</summary>
    [JsonPropertyName("normalize")]
    public bool Normalize { get; set; } = true;

    /// <summary>Return audio as a chunked stream instead of waiting for full synthesis.</summary>
    [JsonPropertyName("streaming")]
    public bool Streaming { get; set; } = true;
}
