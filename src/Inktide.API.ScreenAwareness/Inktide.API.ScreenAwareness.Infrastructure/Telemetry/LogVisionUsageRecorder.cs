using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.ScreenAwareness.Infrastructure.Telemetry;

/// <summary>
/// Log-only implementation of <see cref="IVisionUsageRecorder"/>.
/// TODO(billing): replace with a database-backed recorder for production billing.
/// </summary>
public sealed class LogVisionUsageRecorder : IVisionUsageRecorder
{

    private readonly ILogger<LogVisionUsageRecorder> _logger;

    public LogVisionUsageRecorder(ILogger<LogVisionUsageRecorder> logger)
    {
        _logger = logger;
    }

    public ValueTask RecordAsync(VisionUsageEvent e)
    {
        _logger.LogInformation(
            "Vision usage: tenant={TenantId} streamer={StreamerId} frames={Frames} events={Events} tokens={Tokens} cost={Cost} ts={Ts}",
            e.TenantId, e.StreamerId, e.FramesProcessed, e.EventsDetected, e.TokensInputUsed, e.CostUsd, e.TimestampUtc);
        return ValueTask.CompletedTask;
    }

}
