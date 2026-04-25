namespace Inktide.API.Realtime.Infrastructure.Configuration;

/// <summary>
/// Settings for consuming LLM text chunks from the <c>synapse.llm.response</c> Redis stream
/// and delivering them to browser clients via SignalR <c>textChunk</c> events.
/// </summary>
public sealed class RealtimeTextStreamSettings
{
    public const string SectionName = "RealtimeTextStream";

    /// <summary>Redis stream key produced by the LLM worker.</summary>
    public string StreamName { get; set; } = "synapse.llm.response";

    /// <summary>Consumer group name; separate from the TTS consumer group on the same stream.</summary>
    public string ConsumerGroup { get; set; } = "text-delivery-workers";

    /// <summary>Prefix for consumer name; full name is <c>{prefix}-{instanceId}</c>.</summary>
    public string ConsumerNamePrefix { get; set; } = "text-delivery";

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
