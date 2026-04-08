using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Voice selection object in the Cartesia synthesis request.
/// </summary>
internal sealed class CartesiaVoice
{
    #region Properties

    /// <summary>Selection mode. Always <c>"id"</c> for pre-built voices.</summary>
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "id";

    /// <summary>Cartesia voice UUID.</summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>Optional runtime voice controls (speed, emotion).</summary>
    [JsonPropertyName("__experimental_controls")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public CartesiaVoiceControls? ExperimentalControls { get; set; }

    #endregion
}
