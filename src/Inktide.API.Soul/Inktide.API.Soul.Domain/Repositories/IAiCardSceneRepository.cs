using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IAiCardSceneRepository
{
    Task<AiCardScene> AddAsync(AiCardScene scene, CancellationToken ct = default);

    Task<int> CountByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task<IReadOnlyList<AiCardScene>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task<AiCardScene?> GetByIdAsync(Guid userId, Guid aiCardId, Guid sceneId, CancellationToken ct = default);

    Task DeleteAsync(AiCardScene scene, CancellationToken ct = default);

    /// <summary>Returns all scenes for the card except <paramref name="excludeId"/> — used to clean up before replacing.</summary>
    Task<IReadOnlyList<AiCardScene>> ListOthersByCardAsync(Guid userId, Guid aiCardId, Guid excludeId, CancellationToken ct = default);

    Task<IReadOnlyList<string>> ListDistinctTagsByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    /// <summary>Sets <see cref="AiCardScene.Tag"/>; use null to clear.</summary>
    Task<bool> UpdateTagAsync(Guid userId, Guid aiCardId, Guid sceneId, string? tag, CancellationToken ct = default);

    /// <summary>Sets display name, description, and tag in one update.</summary>
    Task<bool> UpdateMetadataAsync(
        Guid userId,
        Guid aiCardId,
        Guid sceneId,
        string? displayName,
        string? description,
        string? tag,
        CancellationToken ct = default);

    /// <summary>Returns all (id, sort_key) pairs for the card ordered by sort_key ASC.</summary>
    Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid aiCardId, CancellationToken ct = default);

    /// <summary>Updates sort_key for each entry in the list. Only rows owned by <paramref name="userId"/> are updated.</summary>
    Task BulkUpdateSortKeysAsync(Guid userId, IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default);
}
