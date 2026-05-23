using System.Diagnostics.Metrics;

namespace Inktide.API.ScreenAwareness.Infrastructure.Telemetry;

public sealed class ScreenAwarenessMetrics
{

    private readonly Meter _meter = new("Inktide.API.ScreenAwareness", "1.0.0");

    public readonly Counter<long> FramesIngested;
    public readonly Counter<long> FramesDeduplicated;
    public readonly Counter<long> FramesBudgetExceeded;
    public readonly Counter<long> FramesProcessed;
    public readonly Counter<long> EventsDetected;
    public readonly Counter<long> VisionTimeouts;
    public readonly Histogram<double> VisionLatencyMs;

    public ScreenAwarenessMetrics()
    {
        FramesIngested      = _meter.CreateCounter<long>("screen.frames.ingested",       description: "Frames accepted into the ingestion queue.");
        FramesDeduplicated  = _meter.CreateCounter<long>("screen.frames.deduplicated",   description: "Frames dropped by pHash scene dedup.");
        FramesBudgetExceeded= _meter.CreateCounter<long>("screen.frames.budget_exceeded",description: "Frames rejected due to tenant hourly budget.");
        FramesProcessed     = _meter.CreateCounter<long>("screen.frames.processed",      description: "Frames successfully analyzed by the vision model.");
        EventsDetected      = _meter.CreateCounter<long>("screen.events.detected",       description: "Screen events detected across all frames.");
        VisionTimeouts      = _meter.CreateCounter<long>("screen.vision.timeouts",       description: "Vision model calls that timed out.");
        VisionLatencyMs     = _meter.CreateHistogram<double>("screen.vision.latency_ms", description: "End-to-end vision model call duration in milliseconds.");
    }

}
