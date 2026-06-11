using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class TtsConfigSettings
{

    [JsonPropertyName("schema_version")]
    public int SchemaVersion { get; set; } = 1;

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

    [JsonPropertyName("stability")]
    public float Stability { get; set; } = 0.5f;

    [JsonPropertyName("similarity_boost")]
    public float SimilarityBoost { get; set; } = 0.75f;

    [JsonPropertyName("style")]
    public float Style { get; set; } = 0.0f;

    [JsonPropertyName("use_speaker_boost")]
    public bool UseSpeakerBoost { get; set; } = true;

    [JsonPropertyName("pitch")]
    public float Pitch { get; set; } = 1.0f;

    [JsonPropertyName("volume")]
    public float Volume { get; set; } = 1.0f;

    public static TtsConfigSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<TtsConfigSettings>(json);

}
