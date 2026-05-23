namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Read-only query interface for resolving active run presets from Synapse (no auth context needed).
/// Implemented in Soul.Infrastructure; consumed by Synapse.Infrastructure via project reference.
/// </summary>
public interface IAiCardRunPresetQueryService
{
    /// <summary>
    /// Returns the active run preset for <paramref name="cardId"/>, or null if no preset is active.
    /// Used by Synapse at context-resolution time to apply runtime overrides.
    /// </summary>
    Task<ActiveRunPresetDto?> GetActiveForCardAsync(Guid cardId, CancellationToken ct = default);
}

public sealed record ActiveRunPresetDto(
    Guid Id,
    string Name,
    string? OverrideLlmModelId,
    float? OverrideTemperature,
    string? OverrideEmotionPresetId,
    string? OverrideVoiceProfileId);
