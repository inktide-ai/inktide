using System.Text.Json.Serialization;
using Inktide.API.Domain.Enums;

namespace Inktide.API.TTS.Infrastructure.Kokoro;


/// <summary>
/// Kokoro OpenAPI <c>OpenAISpeechRequest</c> JSON body (snake_case keys).
/// </summary>
public sealed class KokoroSpeechOptions
{

    [JsonPropertyName("input")]
    public string Input { get; set; } = string.Empty;

    [JsonPropertyName("voice")]
    [JsonConverter(typeof(KokoroSpeechVoiceJsonConverter))]
    public KokoroSpeechVoice Voice { get; set; } = KokoroSpeechVoice.AfAlloy;

    [JsonPropertyName("model")]
    public string Model { get; set; } = "kokoro";

    [JsonPropertyName("response_format")]
    public string ResponseFormat { get; set; } = "mp3";

    [JsonPropertyName("download_format")]
    public string? DownloadFormat { get; set; } = "mp3";

    [JsonPropertyName("speed")]
    public double Speed { get; set; } = 1.0;

    [JsonPropertyName("stream")]
    public bool Stream { get; set; } = true;

    [JsonPropertyName("return_download_link")]
    public bool ReturnDownloadLink { get; set; } = false;

    [JsonPropertyName("lang_code")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LangCode { get; set; }

    [JsonPropertyName("volume_multiplier")]
    public double? VolumeMultiplier { get; set; } = 1.0;

    [JsonPropertyName("normalization_options")]
    public KokoroNormalizationOptions? NormalizationOptions { get; set; }

}
