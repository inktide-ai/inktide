namespace Inktide.API.TTS.Domain.Models;

/// <summary>
/// Requested output format token (e.g. <c>mp3</c>, <c>wav</c>, <c>opus</c>) via <see cref="AudioFormat"/>.
/// Providers map this to their own format parameter. <c>null</c> -> provider default.
/// <see cref="ProviderParams"/> carries provider-specific keys each provider reads and ignores the rest.
/// </summary>
public sealed record SpeechOptions(
    string Text,
    string Voice,
    string? Model = null,
    float Speed = 1.0f,
    string? AudioFormat = null,
    IReadOnlyDictionary<string, object>? ProviderParams = null);
