namespace Chimera.API.Synapse.Application.Models;

/// <summary>
/// Resolved AI card configuration for the current channel.
/// Placed in <see cref="MessageProcessingContext"/> during channel context resolution (before scatter shards).
/// </summary>
public sealed record AiCardContext(
    Guid AiCardId,
    Guid UserId,
    string SystemPrompt,
    string Personality,
    string LlmProviderId,
    string LlmModel,
    bool MemoryEnabled,
    int MaxMemories,
    /// <summary>TTS provider id (e.g. "kokoro"). Null means TTS is disabled for this card.</summary>
    string? TtsProviderId,
    /// <summary>Voice id within the provider (e.g. "af_heart"). Null when TTS is disabled.</summary>
    string? TtsVoiceId,
    /// <summary>Specific model override for TTS. Null = provider default.</summary>
    string? TtsModelId,
    /// <summary>Speech speed multiplier. 1.0 = normal.</summary>
    float TtsSpeed,
    /// <summary>"chat" — buffer full response as one TTS chunk; "narration" — sentence-based chunking.</summary>
    string ChunkingMode = "narration",
    /// <summary>BCP-47 language tag for LLM response language (e.g. "ru", "en"). Null = no override.</summary>
    string? Language = null,
    /// <summary>Sampling temperature passed to the LLM provider. Higher = more random.</summary>
    float LlmTemperature = 0.7f,
    /// <summary>Maximum number of tokens to generate (maps to num_predict in Ollama).</summary>
    int LlmMaxTokens = 512,
    /// <summary>Nucleus sampling probability mass (top-p).</summary>
    float LlmTopP = 0.9f,
    /// <summary>Penalty for token frequency — reduces repetition of the same phrases.</summary>
    float LlmFrequencyPenalty = 0f,
    /// <summary>Penalty for token presence — encourages talking about new topics.</summary>
    float LlmPresencePenalty = 0f,
    /// <summary>Milliseconds to wait before publishing the first TTS chunk after LLM generation completes.</summary>
    int ResponseDelayMs = 0,
    /// <summary>Per-card base URL override — wins over global BYOK credential base URL.</summary>
    string? LlmBaseUrl = null,
    /// <summary>Multiplier applied to raw emotion intensity (0 = no emotion, 1 = normal, 2 = amplified).</summary>
    float EmotionIntensityScale = 1.0f);
