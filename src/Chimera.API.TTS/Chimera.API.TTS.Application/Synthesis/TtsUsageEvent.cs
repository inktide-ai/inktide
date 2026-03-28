namespace Chimera.API.TTS.Application.Synthesis;

/// <summary>
/// Immutable record of a completed TTS synthesis, used for usage metering and billing.
/// </summary>
public sealed record TtsUsageEvent(
    string? UserId,
    string ProviderId,
    int CharacterCount,
    string AudioFormat,
    bool Streamed,
    DateTimeOffset TimestampUtc);
