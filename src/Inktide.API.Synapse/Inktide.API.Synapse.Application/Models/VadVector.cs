namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Valence-Arousal-Dominance affective vector. All axes in [-1, +1].
/// Single source of truth for emotional state that drives all downstream systems:
/// TTS prosody, VRM animation physics, blink rhythm, head pose, idle tempo.
/// </summary>
public readonly record struct VadVector(float V, float A, float D)
{
    /// <summary>Neutral baseline - no emotional modulation.</summary>
    public static VadVector Neutral => new(0f, 0f, 0f);
}
