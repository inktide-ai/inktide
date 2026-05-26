namespace Inktide.API.Synapse.Application.Configuration;

/// <summary>
/// Configuration for the .NET LLM stream worker that replaces the Python llm-worker.
/// Reads aggregated envelopes from <see cref="StreamIn"/>, calls the configured LLM provider via
/// Semantic Kernel, and publishes sentence-chunked responses to <see cref="StreamOut"/>.
/// </summary>
public sealed class LlmStreamSettings
{
    public const string SectionName = "LlmStream";

    /// <summary>Redis stream to read from (published by SynapseAggregationService).
    /// Default matches <c>Inktide.API.Core.Constants.StreamNames.LlmReady</c>.</summary>
    public string StreamIn { get; set; } = "synapse.llm.ready";

    /// <summary>Redis stream to publish sentence chunks to (consumed by TTS LlmResponseStreamConsumer).
    /// Default matches <c>Inktide.API.Core.Constants.StreamNames.LlmResponse</c>.</summary>
    public string StreamOut { get; set; } = "synapse.llm.response";

    public string ConsumerGroup { get; set; } = "llm-workers";
    public string ConsumerNamePrefix { get; set; } = "llm";
    public string PayloadFieldName { get; set; } = "payload";

    /// <summary>Provider ID to use when an AiCard's provider is not registered or unavailable.</summary>
    public string FallbackProviderId { get; set; } = "ollama";

    public int ReadCount { get; set; } = 8;
    public int ReadBlockMilliseconds { get; set; } = 2000;
    public int AutoClaimMinIdleMs { get; set; } = 30_000;
    public int AutoClaimBatchSize { get; set; } = 50;
    public int AutoClaimLoopDelaySeconds { get; set; } = 30;

    /// <summary>Approximate MAXLEN for the output stream.</summary>
    public long ApproximateMaxLength { get; set; } = 50_000;

    /// <summary>
    /// Maximum number of LLM requests processed concurrently by this worker instance.
    /// Default 1 (serial) is safe for single-tenant dev; raise to 3–5 for production
    /// with a fast LLM provider. Higher values increase throughput at the cost of
    /// proportionally higher LLM API spend and memory.
    /// </summary>
    public int MaxConcurrentRequests { get; set; } = 1;

    /// <summary>After this many XAUTOCLAIM deliveries without ACK, move to DLQ and ACK.</summary>
    public int MaxPoisonMessageDeliveries { get; set; } = 5;

    /// <summary>Redis stream for poison messages. Empty = disable DLQ (ACK and lose after max retries).</summary>
    public string DeadLetterStreamName { get; set; } = "synapse.llm.ready.dlq";
}
