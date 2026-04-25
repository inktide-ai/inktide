using Inktide.API.TTS.Application.Synthesis;

namespace Inktide.API.TTS.Application.Abstractions;

/// <summary>
/// Records TTS synthesis usage for billing, metering, and analytics.
/// Implementations may write to a log, a database, a message queue, etc.
/// </summary>
public interface ITtsUsageRecorder
{
    /// <summary>
    /// Records a completed synthesis event. Called only on <see cref="SpeechResult.Ok"/>.
    /// </summary>
    ValueTask RecordAsync(TtsUsageEvent usageEvent);
}
