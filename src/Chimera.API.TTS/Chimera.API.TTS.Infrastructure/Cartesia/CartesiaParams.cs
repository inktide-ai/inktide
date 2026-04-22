using System.Text.Json;
using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Typed projection of the Cartesia-specific keys from
/// <c>SpeechOptions.ProviderParams</c>. Handles both boxed CLR primitives
/// and <see cref="JsonElement"/> values produced by JSON deserialization.
/// </summary>
internal sealed class CartesiaParams
{

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling              = JsonNumberHandling.AllowReadingFromString,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
    };


    /// <summary>
    /// Latency hint: <c>"normal"</c> (default, balanced quality) or
    /// <c>"optimistic"</c> (lowest TTFB, slightly reduced quality).
    /// </summary>
    [JsonPropertyName("latency")]
    public string? Latency { get; init; }


    public string GetLatency() => Latency ?? "normal";


    /// <summary>
    /// Deserializes provider-specific params from the loosely-typed dictionary.
    /// Returns defaults when <paramref name="raw"/> is <see langword="null"/> or unparseable.
    /// </summary>
    internal static CartesiaParams From(IReadOnlyDictionary<string, object>? raw)
    {
        if (raw is null) return new();
        try
        {
            var json = JsonSerializer.SerializeToElement(raw, SerializerOptions);
            return JsonSerializer.Deserialize<CartesiaParams>(json, SerializerOptions) ?? new();
        }
        catch (JsonException)
        {
            return new();
        }
    }

}
