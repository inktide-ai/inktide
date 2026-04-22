using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Audio output format descriptor for the Cartesia synthesis request.
/// </summary>
internal sealed class CartesiaOutputFormat
{

    /// <summary>Audio container: <c>mp3</c>, <c>wav</c>, <c>ogg</c>.</summary>
    [JsonPropertyName("container")]
    public string Container { get; set; } = "mp3";

    /// <summary>
    /// Encoding inside the container: <c>mp3</c>, <c>pcm_f32le</c>, <c>opus</c>, etc.
    /// </summary>
    [JsonPropertyName("encoding")]
    public string Encoding { get; set; } = "mp3";

    /// <summary>Sample rate in Hz.</summary>
    [JsonPropertyName("sample_rate")]
    public int SampleRate { get; set; } = 44100;

}
