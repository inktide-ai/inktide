using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class TtsConfigSettings
{

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    [JsonPropertyName("provider_id")]
    public string? ProviderId { get; set; }

    [JsonPropertyName("voice_id")]
    public string? VoiceId { get; set; }

    [JsonPropertyName("speed")]
    public float Speed { get; set; } = 1.0f;

    [JsonPropertyName("model_id")]
    public string? ModelId { get; set; }

    [JsonPropertyName("api_key")]
    public string? ApiKey { get; set; }

    [JsonPropertyName("base_url")]
    public string? BaseUrl { get; set; }

    public static TtsConfigSettings Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new TtsConfigSettings();
        try { return JsonSerializer.Deserialize<TtsConfigSettings>(json, JsonOpts) ?? new TtsConfigSettings(); }
        catch { return new TtsConfigSettings(); }
    }

}
