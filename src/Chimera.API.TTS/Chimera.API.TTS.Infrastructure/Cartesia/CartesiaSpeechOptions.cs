using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// JSON body for <c>POST /tts/bytes</c>.
/// </summary>
internal sealed class CartesiaSpeechOptions
{
    #region Properties

    [JsonPropertyName("model_id")]
    public string ModelId { get; set; } = "sonic-2";

    [JsonPropertyName("transcript")]
    public string Transcript { get; set; } = string.Empty;

    [JsonPropertyName("voice")]
    public CartesiaVoice Voice { get; set; } = new();

    [JsonPropertyName("output_format")]
    public CartesiaOutputFormat OutputFormat { get; set; } = new();

    #endregion
}
