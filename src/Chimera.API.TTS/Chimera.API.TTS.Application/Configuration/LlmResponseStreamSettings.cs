namespace Chimera.API.TTS.Application.Configuration;

/// <summary>
/// Settings for consuming LLM text responses from the <c>synapse.llm.response</c> Redis stream.
/// The TTS bounded context owns this consumer — it reads completed LLM responses and drives audio synthesis.
/// </summary>
public sealed class LlmResponseStreamSettings
{
    public const string SectionName = "LlmResponseStream";

    /// <summary>Redis stream key written by the Python llm-worker.</summary>
    public string StreamName { get; set; } = "synapse.llm.response";

    /// <summary>Consumer group for TTS workers.</summary>
    public string ConsumerGroup { get; set; } = "tts-workers";

    /// <summary>Prefix for consumer name; full name is <c>{prefix}-{instanceId}</c>.</summary>
    public string ConsumerNamePrefix { get; set; } = "tts";

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

    /// <summary>
    /// Default TTS voice id used when the AiCard has no voice configured.
    /// Kokoro voices: https://kokorotts.net/voices
    /// </summary>
    public string DefaultVoiceId { get; set; } = "af_heart";
}
