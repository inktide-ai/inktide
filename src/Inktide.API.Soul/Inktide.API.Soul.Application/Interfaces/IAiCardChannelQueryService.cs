using Inktide.API.Soul.Domain.ValueObjects;

namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Read-only query contract that lets Synapse resolve AI card configuration
/// for an inbound channel without directly coupling to Soul's DB context.
/// </summary>
public interface IAiCardChannelQueryService
{
    /// <summary>
    /// Resolves the AI card context for the given platform channel ID.
    /// Returns null if no active channel mapping exists.
    /// </summary>
    Task<AiCardChannelContext?> ResolveByChannelIdAsync(string channelId, CancellationToken ct = default);

    /// <summary>
    /// Resolves the AI card context directly by card ID (used for inktide-chat fallback).
    /// Returns null if the card does not exist or has been deleted.
    /// </summary>
    Task<AiCardChannelContext?> ResolveByCardIdAsync(Guid cardId, CancellationToken ct = default);
}

/// <summary>
/// Typed projection of the AI card data that Synapse needs to build a prompt context.
/// JSON config blobs are parsed once at the Soul boundary and surfaced as value objects.
/// </summary>
public sealed record AiCardChannelContext(
    Guid AiCardId,
    Guid UserId,
    string SystemPrompt,
    string Personality,
    string? LlmProvider,
    string? LlmModelId,
    LlmConfigSettings LlmConfig,
    TtsConfigSettings TtsConfig,
    ResponseBehaviorSettings Behavior,
    MemoryConfigSettings Memory,
    PersonalitySettings PersonalityConfig,
    bool ScreenAwarenessEnabled = false);
