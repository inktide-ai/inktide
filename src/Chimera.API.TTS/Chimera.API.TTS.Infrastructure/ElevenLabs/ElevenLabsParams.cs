using System.Text.Json;
using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// Typed projection of the ElevenLabs-specific keys from
/// <c>SpeechOptions.ProviderParams</c>. Replaces the ad-hoc
/// <c>GetDouble</c>/<c>GetBool</c> switch expressions in the provider.
/// </summary>
internal sealed class ElevenLabsParams
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive  = true,
        NumberHandling               = JsonNumberHandling.AllowReadingFromString,
        DefaultIgnoreCondition       = JsonIgnoreCondition.WhenWritingNull,
    };

    [JsonPropertyName("stability")]
    public double? Stability { get; init; }

    [JsonPropertyName("similarity_boost")]
    public double? SimilarityBoost { get; init; }

    [JsonPropertyName("style")]
    public double? Style { get; init; }

    [JsonPropertyName("use_speaker_boost")]
    public bool? UseSpeakerBoost { get; init; }

    // ── Effective values with domain defaults ────────────────────────────────

    public double GetStability()       => Stability       ?? 0.5;
    public double GetSimilarityBoost() => SimilarityBoost ?? 0.75;
    public double GetStyle()           => Style           ?? 0.0;
    public bool   GetUseSpeakerBoost() => UseSpeakerBoost ?? true;

    // ── Factory ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Deserializes provider-specific params from the loosely-typed dictionary.
    /// Handles both boxed CLR primitives and <see cref="JsonElement"/> values.
    /// Returns defaults when <paramref name="raw"/> is null or unparseable.
    /// </summary>
    internal static ElevenLabsParams From(IReadOnlyDictionary<string, object>? raw)
    {
        if (raw is null) return new();
        try
        {
            var json = JsonSerializer.SerializeToElement(raw, SerializerOptions);
            return JsonSerializer.Deserialize<ElevenLabsParams>(json, SerializerOptions) ?? new();
        }
        catch (JsonException)
        {
            return new();
        }
    }
}
