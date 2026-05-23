namespace Inktide.API.Core.Constants;

/// <summary>
/// Single source of truth for Redis stream names used across the pipeline.
/// All settings classes use these as default values so config and code stay in sync.
/// </summary>
public static class StreamNames
{
    /// <summary>Connector → Synapse: raw inbound chat messages.</summary>
    public const string SynapseIngest = "synapse.ingest";

    /// <summary>Synapse → LLM worker: aggregated context envelope ready for LLM call.</summary>
    public const string LlmReady = "synapse.llm.ready";

    /// <summary>LLM worker → TTS + Realtime: sentence-chunked LLM text output.</summary>
    public const string LlmResponse = "synapse.llm.response";

    /// <summary>TTS → Realtime: synthesized audio payloads for browser push.</summary>
    public const string TtsReady = "synapse.tts.ready";

    /// <summary>ScreenAwareness ingestion: raw frames pending vision analysis.</summary>
    public const string ScreenFramesPending = "screen.frames.pending";

    /// <summary>Outbox processor → consumers: integration events from all bounded contexts.</summary>
    public const string IntegrationEvents = "integration.events";

    /// <summary>Event type published when a user account is deleted. Subscribed by Soul and other contexts.</summary>
    public const string EventTypeUserAccountDeleted = "user.account.deleted";
}
