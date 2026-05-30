using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Emotion;

/// <summary>
/// Maps emotion label strings (from OllamaEmotionClassifier) to VAD vectors.
/// Backward-compatible: the classifier prompt is unchanged, we just convert its output.
///
/// VAD reference values validated against the SoulState visualization presets.
/// </summary>
internal static class EmotionVadTable
{
    private static readonly IReadOnlyDictionary<string, VadVector> Table =
        new Dictionary<string, VadVector>(StringComparer.OrdinalIgnoreCase)
        {
            ["excited"]   = new( 0.7f,  0.9f,  0.6f),
            ["happy"]     = new( 0.6f,  0.4f,  0.4f),
            ["blush"]     = new( 0.4f,  0.3f,  0.0f),
            ["surprised"] = new( 0.2f,  0.9f, -0.3f),
            ["thinking"]  = new( 0.0f, -0.2f,  0.1f),
            ["relax"]     = new( 0.5f, -0.5f,  0.3f),
            ["sarcastic"] = new(-0.1f,  0.1f,  0.5f),
            ["angry"]     = new(-0.8f,  0.8f,  0.9f),
            ["sad"]       = new(-0.7f, -0.6f, -0.5f),
            ["sleepy"]    = new( 0.2f, -0.8f, -0.2f),
        };

    /// <summary>
    /// Returns the VAD vector for the given emotion label.
    /// Null or unknown labels return <see cref="VadVector.Neutral"/>.
    /// </summary>
    public static VadVector Map(string? emotion)
        => emotion is not null && Table.TryGetValue(emotion, out var vad) ? vad : VadVector.Neutral;
}
