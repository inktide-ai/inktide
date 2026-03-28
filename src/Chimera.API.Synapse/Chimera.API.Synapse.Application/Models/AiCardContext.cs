namespace Chimera.API.Synapse.Application.Models;

/// <summary>
/// Resolved AI card configuration for the current channel.
/// Placed in <see cref="MessageProcessingContext"/> during channel context resolution (before scatter shards).
/// </summary>
public sealed record AiCardContext(
    Guid AiCardId,
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
    float TtsSpeed);
