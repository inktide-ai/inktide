using System.Text.Json.Serialization;

namespace Inktide.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Runtime voice controls sent inside <c>__experimental_controls</c>.
/// </summary>
internal sealed class CartesiaVoiceControls
{

    /// <summary>
    /// Speech speed: <c>-1.0</c> (slowest) -> <c>0.0</c> (normal) -> <c>1.0</c> (fastest).
    /// </summary>
    [JsonPropertyName("speed")]
    public double Speed { get; set; } = 0.0;

}
