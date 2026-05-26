namespace Inktide.API.TTS.Domain.Models;

/// <summary>
/// Catalog metadata for a speech (TTS) provider.
/// </summary>
public sealed record SpeechProviderDescriptor(
    string Id,
    string DisplayName,
    SpeechProviderCapabilities Capabilities);
