namespace Chimera.API.TTS.Domain.Models;

/// <summary>
/// A TTS voice with optional display metadata.
/// Providers that only expose voice IDs leave <see cref="Name"/> null.
/// </summary>
public sealed record SpeechVoice(
    string Id,
    string? Name = null,
    string? Category = null,
    IReadOnlyDictionary<string, string>? Labels = null);
