namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Personality-driven emotional dynamics parameters passed through the Synapse pipeline.
/// Extracted from <see cref="PersonalitySettings"/> at channel resolution time so that
/// Synapse.Application has no dependency on Soul.Domain types.
/// </summary>
public sealed record EmotionDynamics(
    /// <summary>How widely mood swings per message (PersonalitySettings.EmotionVolatility).</summary>
    float Volatility,
    /// <summary>How quickly emotions absorb new classifications (PersonalitySettings.EmotionResponsiveness).</summary>
    float Responsiveness,
    /// <summary>How much prior emotional state persists across turns (PersonalitySettings.EmotionMemory).</summary>
    float Memory)
{
    public static readonly EmotionDynamics Default = new(0.5f, 0.7f, 0.5f);
}
