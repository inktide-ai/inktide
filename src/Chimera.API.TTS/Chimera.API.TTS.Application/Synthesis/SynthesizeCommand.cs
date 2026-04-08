namespace Chimera.API.TTS.Application.Synthesis;

/// <summary>
/// TTS synthesis input independent of HTTP transport.
/// </summary>
public sealed record SynthesizeCommand(
    string? ProviderId,
    string Text,
    string VoiceId,
    string? ModelId,
    float? Speed,
    bool Stream,
    string? AudioFormat = null,
    string? UserId = null,
    IReadOnlyDictionary<string, object>? ProviderParams = null);
