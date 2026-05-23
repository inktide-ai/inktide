using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardRunPresetService
{
    /// <summary>Returns all run presets for a card. Null if the card does not exist or does not belong to the user.</summary>
    Task<IReadOnlyList<AiCardRunPreset>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    Task<AiCardRunPreset?> GetByIdAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default);

    Task<AiCardRunPreset?> CreateAsync(
        Guid userId,
        Guid cardId,
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId,
        CancellationToken ct = default);

    Task<AiCardRunPreset?> UpdateAsync(
        Guid userId,
        Guid cardId,
        Guid presetId,
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId,
        CancellationToken ct = default);

    /// <summary>Returns true on success, false if the preset was not found.</summary>
    Task<bool> DeleteAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default);

    /// <summary>
    /// Makes <paramref name="presetId"/> the active preset and deactivates all others for the card.
    /// Returns the activated preset, or null if not found.
    /// </summary>
    Task<AiCardRunPreset?> ActivateAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default);

    /// <summary>Deactivates the currently active preset (if any) for the card.</summary>
    Task DeactivateActiveAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    /// <summary>
    /// Moves <paramref name="presetId"/> between <paramref name="previousId"/> and <paramref name="nextId"/>.
    /// Null previous = beginning. Null next = end.
    /// Returns the updated preset, or null if not found.
    /// </summary>
    Task<AiCardRunPreset?> ReorderAsync(
        Guid userId, Guid cardId, Guid presetId,
        Guid? previousId, Guid? nextId,
        CancellationToken ct = default);
}
