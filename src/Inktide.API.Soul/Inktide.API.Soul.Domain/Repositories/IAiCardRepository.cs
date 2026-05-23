using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IAiCardRepository
{
    Task<AiCard?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AiCard?> GetByIdWithRelationsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<AiCard>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Lightweight list query for the card list view.
    /// Includes <see cref="AiCard.LlmCatalog"/> (for display name) and active
    /// <see cref="AiCard.Channels"/> (for platform badges). Uses split query to
    /// avoid Cartesian explosion.
    /// </summary>
    Task<IReadOnlyList<AiCard>> GetSummaryListByUserIdAsync(Guid userId, CancellationToken ct = default);

    Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<AiCard> CreateAsync(AiCard card, CancellationToken ct = default);
    Task UpdateAsync(AiCard card, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default);

    /// <summary>Fetches a card by slug for the public profile page (no user filter).</summary>
    Task<AiCard?> GetPublicBySlugAsync(string slug, CancellationToken ct = default);

    /// <summary>Returns all (id, sort_key) pairs for the user ordered by sort_key ASC.</summary>
    Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Updates sort_key for each entry in the list. Callers requiring multi-item atomicity must wrap in ITransactionManager.</summary>
    Task BulkUpdateSortKeysAsync(IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default);
}
