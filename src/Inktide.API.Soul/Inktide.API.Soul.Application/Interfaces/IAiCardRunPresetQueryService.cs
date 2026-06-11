namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Read-only query service for the active run preset of an AI card.
/// Used by Synapse to apply runtime LLM/voice overrides without coupling to Soul's DB context.
/// </summary>
public interface IAiCardRunPresetQueryService
{
    /// <summary>Returns the active run preset for the card, or null when no preset is active.</summary>
    Task<ActiveRunPresetDto?> GetActiveForCardAsync(Guid cardId, CancellationToken ct = default);
}

/// <summary>Read projection of an active run preset — contains only fields relevant to Synapse.</summary>
public sealed record ActiveRunPresetDto(
    Guid Id,
    string Name,
    string? OverrideLlmModelId,
    float? OverrideTemperature,
    string? OverrideEmotionPresetId,
    string? OverrideVoiceProfileId);
