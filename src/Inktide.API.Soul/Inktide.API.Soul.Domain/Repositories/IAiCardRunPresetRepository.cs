using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IAiCardRunPresetRepository
{
    Task<IReadOnlyList<AiCardRunPreset>> GetAllAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task<AiCardRunPreset?> GetByIdAsync(Guid userId, Guid aiCardId, Guid presetId, CancellationToken ct = default);

    /// <summary>Returns the currently active preset for a card, or null if none is active.</summary>
    Task<AiCardRunPreset?> GetActiveAsync(Guid aiCardId, CancellationToken ct = default);

    Task<AiCardRunPreset> AddAsync(AiCardRunPreset preset, CancellationToken ct = default);

    Task UpdateAsync(AiCardRunPreset preset, CancellationToken ct = default);

    Task DeleteAsync(AiCardRunPreset preset, CancellationToken ct = default);

    /// <summary>Sets <c>is_active = false</c> for all presets of <paramref name="aiCardId"/> except <paramref name="exceptId"/>.</summary>
    Task DeactivateAllAsync(Guid aiCardId, Guid? exceptId, CancellationToken ct = default);

    /// <summary>Returns all (id, sort_key) pairs for the card ordered by sort_key ASC.</summary>
    Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid aiCardId, CancellationToken ct = default);

    /// <summary>Updates sort_key for each entry in the list.</summary>
    Task BulkUpdateSortKeysAsync(IReadOnlyList<(Guid Id, string SortKey)> updates, CancellationToken ct = default);
}
