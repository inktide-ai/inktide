namespace Inktide.API.TTS.Application.Configuration;

/// <summary>
/// Settings for consuming LLM text responses from the <c>synapse.llm.response</c> Redis stream.
/// The TTS bounded context owns this consumer — it reads completed LLM responses and drives audio synthesis.
/// </summary>
public sealed class LlmResponseStreamSettings
{
    public const string SectionName = "LlmResponseStream";

    /// <summary>Redis stream key written by the LLM worker.
    /// Default matches <c>Inktide.API.Core.Constants.StreamNames.LlmResponse</c>.</summary>
    public string StreamName { get; init; } = "synapse.llm.response";

    /// <summary>Consumer group for TTS workers.</summary>
    public string ConsumerGroup { get; init; } = "tts-workers";

    /// <summary>Prefix for consumer name; full name is <c>{prefix}-{instanceId}</c>.</summary>
    public string ConsumerNamePrefix { get; init; } = "tts";

    /// <summary>Stream entry field name holding the JSON payload.</summary>
    public string PayloadFieldName { get; init; } = "payload";

    /// <summary>Maximum entries per XREADGROUP batch.</summary>
    public int ReadCount { get; init; } = 8;

    /// <summary>Delay in ms before polling again when no messages are returned.</summary>
    public int ReadBlockMilliseconds { get; init; } = 2000;

    /// <summary>Minimum idle time in ms before XAUTOCLAIM reclaims a stalled message.</summary>
    public long AutoClaimMinIdleMs { get; init; } = 30_000;

    /// <summary>Maximum entries per XAUTOCLAIM batch.</summary>
    public int AutoClaimBatchSize { get; init; } = 20;

    /// <summary>Delay between XAUTOCLAIM background sweep iterations (seconds).</summary>
    public int AutoClaimLoopDelaySeconds { get; init; } = 30;

    /// <summary>
    /// Default TTS voice id used when the AiCard has no voice configured.
    /// Kokoro voices: https://kokorotts.net/voices
    /// </summary>
    public string DefaultVoiceId { get; init; } = "af_heart";
}
