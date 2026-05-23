using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Emotion;

/// <summary>
/// Maps an emotional state to a provider-agnostic <see cref="EmotionSpeechProfile"/>.
/// Intensity and personality responsiveness scale the effect — low intensity or low responsiveness
/// means minimal deviation from 1.0 even for highly emotional states.
/// </summary>
public static class EmotionSpeechProfiles
{

    private sealed record EmotionDeltas(float SpeedDelta, float EnergyDelta);

    private static readonly IReadOnlyDictionary<string, EmotionDeltas> Table =
        new Dictionary<string, EmotionDeltas>(StringComparer.OrdinalIgnoreCase)
        {
            ["happy"]     = new(+0.12f, +0.15f),
            ["surprised"] = new(+0.10f, +0.20f),
            ["angry"]     = new(+0.08f, +0.18f),
            ["excited"]   = new(+0.15f, +0.22f),
            ["blush"]     = new(-0.04f, -0.05f),
            ["relax"]     = new(-0.06f, -0.10f),
            ["thinking"]  = new(-0.03f, -0.08f),
            ["sarcastic"] = new(-0.02f, +0.05f),
            ["sad"]       = new(-0.12f, -0.15f),
            ["sleepy"]    = new(-0.14f, -0.18f),
        };


    /// <summary>
    /// Computes speech modulation based on the current emotion, its intensity,
    /// and the character's emotional responsiveness setting.
    /// Returns <see cref="EmotionSpeechProfile.Neutral"/> when no modulation applies.
    /// </summary>
    public static EmotionSpeechProfile Compute(
        string? emotion,
        float intensity,
        float responsiveness)
    {
        if (string.IsNullOrEmpty(emotion) || intensity < 0.25f)
            return EmotionSpeechProfile.Neutral;

        if (!Table.TryGetValue(emotion, out var deltas))
            return EmotionSpeechProfile.Neutral;

        var scale         = intensity * responsiveness;
        var speedModifier = Math.Clamp(1.0f + deltas.SpeedDelta  * scale, 0.75f, 1.35f);
        var energyModifier = Math.Clamp(1.0f + deltas.EnergyDelta * scale, 0.80f, 1.25f);

        return new EmotionSpeechProfile(speedModifier, energyModifier);
    }

}
