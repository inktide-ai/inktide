using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// Typed projection of Fish Audio-specific keys from
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

    [JsonPropertyName("latency")]
    public string? Latency { get; init; }

    [JsonPropertyName("normalize")]
    public bool? Normalize { get; init; }

    public string GetLatency()   => Latency   ?? "normal";
    public bool   GetNormalize() => Normalize ?? true;

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
