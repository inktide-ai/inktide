using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class LlmConfigSettings
{

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    [JsonPropertyName("temperature")]
    public float Temperature { get; set; } = 0.7f;

    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; set; } = 512;

    [JsonPropertyName("top_p")]
    public float TopP { get; set; } = 0.9f;

    [JsonPropertyName("frequency_penalty")]
    public float FrequencyPenalty { get; set; } = 0f;

    [JsonPropertyName("presence_penalty")]
    public float PresencePenalty { get; set; } = 0f;

    [JsonPropertyName("model_id")]
    public string? ModelId { get; set; }

    [JsonPropertyName("base_url")]
    public string? BaseUrl { get; set; }

    public static LlmConfigSettings Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new LlmConfigSettings();
        try { return JsonSerializer.Deserialize<LlmConfigSettings>(json, JsonOpts) ?? new LlmConfigSettings(); }
        catch { return new LlmConfigSettings(); }
    }

}
