namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Provider-agnostic speech modulation profile computed from the current emotional state.
/// Each TTS provider adapter maps these values to its own parameters:
///   Kokoro      — SpeedModifier via `speed` parameter
///   ElevenLabs  — SpeedModifier via `speed`, EnergyModifier via `style` exaggeration
///   Azure       — SpeedModifier via SSML `rate`, EnergyModifier via `volume`
/// </summary>
public sealed record EmotionSpeechProfile(
    /// <summary>Multiplicative speed modifier. 0.75 = 25% slower, 1.35 = 35% faster. Neutral = 1.0.</summary>
    float SpeedModifier,
    /// <summary>Energy/exaggeration level. Maps to style intensity for providers that support it. Neutral = 1.0.</summary>
    float EnergyModifier = 1.0f)
{
    public static readonly EmotionSpeechProfile Neutral = new(1.0f, 1.0f);
}
