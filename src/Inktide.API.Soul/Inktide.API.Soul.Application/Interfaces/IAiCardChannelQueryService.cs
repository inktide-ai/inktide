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
/// Typed projection of the AI card identity + provider config that Synapse needs.
/// Behavior config (system prompt, personality, response behavior, memory, screen awareness)
/// has moved to the Project context and is no longer included here.
/// </summary>
public sealed record AiCardChannelContext(
    Guid AiCardId,
    Guid UserId,
    string? LlmProvider,
    string? LlmModelId,
    LlmConfigSettings LlmConfig,
    TtsConfigSettings TtsConfig,
    bool LlmRequiresApiKey = true);
