using System.Text.Json;
using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// Typed projection of Fish Audio–specific keys from
/// <c>SpeechOptions.ProviderParams</c>.
/// </summary>
internal sealed class FishAudioParams
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling              = JsonNumberHandling.AllowReadingFromString,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>
    /// Latency mode: <c>"normal"</c> (default) or <c>"balanced"</c> (lower TTFB, slightly lower quality).
    /// </summary>
    [JsonPropertyName("latency")]
    public string? Latency { get; init; }

    /// <summary>Whether to normalise text before synthesis. Defaults to <c>true</c>.</summary>
    [JsonPropertyName("normalize")]
    public bool? Normalize { get; init; }

    // ── Effective values with domain defaults ────────────────────────────────

    public string GetLatency()   => Latency   ?? "normal";
    public bool   GetNormalize() => Normalize ?? true;

    // ── Factory ──────────────────────────────────────────────────────────────

    internal static FishAudioParams From(IReadOnlyDictionary<string, object>? raw)
    {
        if (raw is null) return new();
        try
        {
            var json = JsonSerializer.SerializeToElement(raw, SerializerOptions);
            return JsonSerializer.Deserialize<FishAudioParams>(json, SerializerOptions) ?? new();
        }
        catch (JsonException)
        {
            return new();
        }
    }
}
