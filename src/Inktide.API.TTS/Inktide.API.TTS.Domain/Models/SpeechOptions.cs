namespace Inktide.API.TTS.Domain.Models;

public sealed class SpeechOptions
{
    public string Text { get; set; } = string.Empty;

    public string Voice { get; set; } = string.Empty;

    public string? Model { get; set; }

    public float Speed { get; set; } = 1.0f;

    /// <summary>
    /// Requested output format token (e.g. <c>mp3</c>, <c>wav</c>, <c>opus</c>).
    /// Providers map this to their own format parameter. <c>null</c> → provider default.
    /// </summary>
    public string? AudioFormat { get; set; }

    /// <summary>
    /// Provider-specific parameters that don't fit the common fields.
    /// Each provider reads the keys it understands and ignores the rest.
    /// Example keys: <c>stability</c>, <c>similarity_boost</c>, <c>style</c>, <c>use_speaker_boost</c>.
    /// </summary>
    public IReadOnlyDictionary<string, object>? ProviderParams { get; set; }
}
