namespace Chimera.API.TTS.Domain.Models;

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
}
