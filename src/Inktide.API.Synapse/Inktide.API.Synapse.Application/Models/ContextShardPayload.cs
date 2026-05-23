using Inktide.API.Core.Contracts;
namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Output of the Context scatter shard: a JSON-friendly snapshot of resolved card + inbound message metadata.
/// Built in parallel with Session and RAG once <see cref="AiCardContext"/> exists.
/// Carried through <see cref="SynapseAggregatedEnvelope"/> to the Python LLM worker so it can
/// attach voice/provider metadata to each chunked response without an extra DB round-trip.
/// </summary>
public sealed record ContextShardPayload(
    Guid CharacterId,
    Guid UserId,
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
    float TtsSpeed,
    /// <summary>"chat" — buffer full response as one TTS chunk; "narration" — sentence-based chunking.</summary>
    string ChunkingMode = "narration",
    /// <summary>BCP-47 language tag for LLM response language (e.g. "ru", "en"). Null = no override.</summary>
    string? Language = null,
    /// <summary>Sampling temperature forwarded to the LLM provider.</summary>
    float LlmTemperature = 0.7f,
    /// <summary>Maximum tokens to generate (num_predict in Ollama).</summary>
    int LlmMaxTokens = 512,
    /// <summary>Top-p nucleus sampling.</summary>
    float LlmTopP = 0.9f,
    /// <summary>Frequency penalty — reduces repetition of the same phrases.</summary>
    float LlmFrequencyPenalty = 0f,
    /// <summary>Presence penalty — encourages new topics.</summary>
    float LlmPresencePenalty = 0f,
    /// <summary>Milliseconds to wait before publishing the first TTS chunk after generation completes.</summary>
    int ResponseDelayMs = 0,
    /// <summary>Per-card base URL override — wins over global BYOK credential base URL.</summary>
    string? LlmBaseUrl = null,
    /// <summary>How quickly emotions adapt to messages — scales TTS speed modulation. From PersonalitySettings.</summary>
    float EmotionResponsiveness = 0.7f,
    /// <summary>Natural-language personality directive block injected into the LLM system prompt. Null = no personality configured.</summary>
    string? PersonalityDirective = null,
    /// <summary>Per-project plugin configuration. Null = all plugins default ON (backwards compatible).</summary>
    IReadOnlyList<ProjectPluginDto>? Plugins = null);
