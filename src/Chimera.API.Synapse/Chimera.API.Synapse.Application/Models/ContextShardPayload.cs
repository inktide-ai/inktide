namespace Chimera.API.Synapse.Application.Models;

/// <summary>
/// Output of the Context scatter shard: a JSON-friendly snapshot of resolved card + inbound message metadata.
/// Built in parallel with Session and RAG once <see cref="AiCardContext"/> exists.
/// Carried through <see cref="SynapseAggregatedEnvelope"/> to the Python LLM worker so it can
/// attach voice/provider metadata to each chunked response without an extra DB round-trip.
/// </summary>
public sealed record ContextShardPayload(
    Guid AiCardId,
    string ChannelId,
    string ChannelName,
    string SystemPrompt,
    string Personality,
    string LlmProviderId,
    string LlmModel,
    bool MemoryEnabled,
    int MaxMemories,
    string InboundTextPreview,
    /// <summary>TTS provider id (e.g. "kokoro"). Null = TTS disabled.</summary>
    string? TtsProviderId,
    /// <summary>Voice id within the TTS provider. Null = TTS disabled.</summary>
    string? TtsVoiceId,
    /// <summary>TTS model override. Null = provider default.</summary>
    string? TtsModelId,
    /// <summary>Speech speed multiplier. 1.0 = normal.</summary>
    float TtsSpeed);
