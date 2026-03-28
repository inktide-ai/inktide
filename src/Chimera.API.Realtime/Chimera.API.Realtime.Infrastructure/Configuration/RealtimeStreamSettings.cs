namespace Chimera.API.Realtime.Infrastructure.Configuration;

/// <summary>
/// Settings for consuming synthesized audio from the <c>synapse.tts.ready</c> Redis stream
/// and delivering it to connected browser clients via SignalR.
/// </summary>
public sealed class RealtimeStreamSettings
{
    public const string SectionName = "RealtimeStream";

    /// <summary>Redis stream key produced by the TTS bounded context.</summary>
    public string StreamName { get; set; } = "synapse.tts.ready";

    /// <summary>Consumer group name; multiple Realtime instances share work.</summary>
    public string ConsumerGroup { get; set; } = "realtime-workers";

    /// <summary>Prefix for consumer name; full name is <c>{prefix}-{instanceId}</c>.</summary>
    public string ConsumerNamePrefix { get; set; } = "realtime";

    /// <summary>Stream entry field name holding the JSON payload.</summary>
    public string PayloadFieldName { get; set; } = "payload";

    /// <summary>Maximum entries per XREADGROUP batch.</summary>
    public int ReadCount { get; set; } = 8;

    /// <summary>Delay in ms before polling again when no messages are returned.</summary>
    public int ReadBlockMilliseconds { get; set; } = 2000;

    /// <summary>Minimum idle time in ms before XAUTOCLAIM reclaims a stalled message.</summary>
    public long AutoClaimMinIdleMs { get; set; } = 30_000;

    /// <summary>Maximum entries per XAUTOCLAIM batch.</summary>
    public int AutoClaimBatchSize { get; set; } = 20;

    /// <summary>Delay between XAUTOCLAIM background sweep iterations (seconds).</summary>
    public int AutoClaimLoopDelaySeconds { get; set; } = 30;
}
