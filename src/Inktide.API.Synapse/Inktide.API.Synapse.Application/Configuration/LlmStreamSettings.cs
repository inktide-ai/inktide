namespace Inktide.API.Synapse.Application.Configuration;

/// <summary>
/// Configuration for the .NET LLM stream worker that replaces the Python llm-worker.
/// Reads aggregated envelopes from <see cref="StreamIn"/>, calls the configured LLM provider via
/// Semantic Kernel, and publishes sentence-chunked responses to <see cref="StreamOut"/>.
/// </summary>
public sealed class LlmStreamSettings
{
    public const string SectionName = "LlmStream";

    /// <summary>Redis stream to read from (published by SynapseAggregationService).</summary>
    public string StreamIn { get; set; } = "synapse.llm.ready";

    /// <summary>Redis stream to publish sentence chunks to (consumed by TTS LlmResponseStreamConsumer).</summary>
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
}
