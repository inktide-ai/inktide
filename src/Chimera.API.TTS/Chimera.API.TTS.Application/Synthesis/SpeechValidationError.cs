namespace Chimera.API.TTS.Application.Synthesis;

/// <summary>
/// A single validation issue for TTS synthesis (e.g. from provider validation).
/// </summary>
public sealed record SpeechValidationError(string PropertyName, string ErrorMessage);
