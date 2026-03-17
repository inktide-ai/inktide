using Chimera.API.Soul.Domain.Entities;

namespace Chimera.API.Soul.Domain.Repositories;

public interface IAiCardRepository
{
    Task<AiCard?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AiCard?> GetByIdWithRelationsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<AiCard>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<AiCard> CreateAsync(AiCard card, CancellationToken ct = default);
    Task UpdateAsync(AiCard card, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default);
}
