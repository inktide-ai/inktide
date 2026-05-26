using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class ResponseBehaviorSettings
{

    [JsonPropertyName("chunking_mode")]
    public string ChunkingMode { get; set; } = "narration";

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("response_delay_ms")]
    public int ResponseDelayMs { get; set; } = 0;

    [JsonPropertyName("emotion_intensity_scale")]
    public float EmotionIntensityScale { get; set; } = 1.0f;

    [JsonPropertyName("max_response_length")]
    public int? MaxResponseLength { get; set; }

    [JsonPropertyName("key_phrases")]
    public string[]? KeyPhrases { get; set; }

    public static ResponseBehaviorSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<ResponseBehaviorSettings>(json);

}
