using Chimera.API.TTS.Application.Abstractions;
using Chimera.API.TTS.Application.Synthesis;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Infrastructure.Telemetry;

/// <summary>
/// Structured-log implementation of <see cref="ITtsUsageRecorder"/>.
/// Each event is emitted as an <c>Information</c> log entry with all billing-relevant fields.
/// Replace or decorate with a database/queue-backed recorder for production billing.
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
