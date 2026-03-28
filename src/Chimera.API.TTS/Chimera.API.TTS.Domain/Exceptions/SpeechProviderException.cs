namespace Chimera.API.TTS.Domain.Exceptions;

/// <summary>
/// Thrown by <see cref="Domain.Speech.ISpeechProvider"/> implementations when synthesis cannot
/// proceed due to provider-specific invalid state (bad voice, unsupported model, etc.).
/// </summary>
public sealed class SpeechProviderException(string message, Exception? inner = null)
    : Exception(message, inner);
