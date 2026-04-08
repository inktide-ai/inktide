using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// ElevenLabs <c>voice_settings</c> JSON body.
/// </summary>
public sealed class ElevenLabsVoiceSettings
{
    #region Properties

    [JsonPropertyName("stability")]
    public double Stability { get; set; } = 0.5;

    [JsonPropertyName("similarity_boost")]
    public double SimilarityBoost { get; set; } = 0.75;

    [JsonPropertyName("style")]
    public double Style { get; set; } = 0.0;

    [JsonPropertyName("use_speaker_boost")]
    public bool UseSpeakerBoost { get; set; } = true;

    [JsonPropertyName("speed")]
    public double Speed { get; set; } = 1.0;

    #endregion
}
