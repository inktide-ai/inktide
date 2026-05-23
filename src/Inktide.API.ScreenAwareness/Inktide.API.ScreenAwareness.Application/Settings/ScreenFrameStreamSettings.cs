namespace Inktide.API.ScreenAwareness.Application.Settings;

public sealed class ScreenFrameStreamSettings
{
    public const string SectionName = "ScreenFrameStream";

    public string StreamName { get; set; } = "screen.frames.pending";
    public string ConsumerGroup { get; set; } = "screen-vision-workers";
    public string ConsumerNamePrefix { get; set; } = "vision";
    public string PayloadFieldName { get; set; } = "payload";
    public long ApproximateMaxLength { get; set; } = 50_000;
    public int ReadBlockMilliseconds { get; set; } = 2000;
    public int ReadCount { get; set; } = 8;
    public long AutoClaimMinIdleMs { get; set; } = 30_000;
    public int AutoClaimBatchSize { get; set; } = 50;
    public int AutoClaimLoopDelaySeconds { get; set; } = 30;

    /// <summary>Frames older than this (ms) when dequeued are dropped without processing.</summary>
    public int StaleFrameAgeMs { get; set; } = 5000;
}
