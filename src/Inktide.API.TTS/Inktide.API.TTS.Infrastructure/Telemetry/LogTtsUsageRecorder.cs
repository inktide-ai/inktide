using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Synthesis;
using Microsoft.Extensions.Logging;

namespace Inktide.API.TTS.Infrastructure.Telemetry;

/// <summary>
/// Structured-log implementation of <see cref="ITtsUsageRecorder"/>.
/// Each synthesis event is emitted as an <c>Information</c> log entry with all usage-relevant fields.
/// Log-based usage tracking is the intended strategy for this deployment.
/// </summary>
public sealed class LogTtsUsageRecorder : ITtsUsageRecorder
{
    private readonly ILogger<LogTtsUsageRecorder> _logger;

    public LogTtsUsageRecorder(ILogger<LogTtsUsageRecorder> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public ValueTask RecordAsync(TtsUsageEvent e)
    {
        _logger.LogInformation(
            "TTS usage: userId={UserId} provider={Provider} chars={Chars} format={Format} streamed={Streamed} ts={Timestamp}",
            e.UserId ?? "(anonymous)",
            e.ProviderId,
            e.CharacterCount,
            e.AudioFormat,
            e.Streamed,
            e.TimestampUtc);

        return ValueTask.CompletedTask;
    }
}
