namespace Inktide.API.Synapse.Application.Models;

public sealed record SynapsePersonalitySnapshot(
    float Warmth,
    float Playfulness,
    float Assertiveness,
    float Empathy,
    float Formality,
    float Sarcasm,
    float EmotionVolatility,
    float EmotionResponsiveness,
    float EmotionMemory,
    string StressBehavior,
    string BaselineMood)
{
    public static readonly SynapsePersonalitySnapshot Default =
        new(0.7f, 0.5f, 0.5f, 0.7f, 0.3f, 0.2f, 0.5f, 0.7f, 0.5f, "deflect", "neutral");
}
