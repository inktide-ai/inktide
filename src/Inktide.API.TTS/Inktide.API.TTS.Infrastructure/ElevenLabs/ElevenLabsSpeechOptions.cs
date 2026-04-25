using System.Text.Json.Serialization;

namespace Inktide.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// ElevenLabs TTS request JSON body for <c>POST /v1/text-to-speech/{voice_id}/stream</c>.
/// </summary>
public sealed class ElevenLabsSpeechOptions
{

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("model_id")]
    public string ModelId { get; set; } = "eleven_multilingual_v2";

    [JsonPropertyName("voice_settings")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ElevenLabsVoiceSettings? VoiceSettings { get; set; }

}
