using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IAiCardModelRepository
{
    Task<AiCardModel> AddAsync(AiCardModel model, CancellationToken ct = default);

    Task<IReadOnlyList<AiCardModel>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task<AiCardModel?> GetByIdAsync(Guid userId, Guid aiCardId, Guid modelId, CancellationToken ct = default);

    Task<int> CountByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task DeleteAsync(AiCardModel model, CancellationToken ct = default);

    /// <summary>Returns all models for the card except <paramref name="excludeId"/> — used to clean up before replacing.</summary>
    Task<IReadOnlyList<AiCardModel>> ListOthersByCardAsync(Guid userId, Guid aiCardId, Guid excludeId, CancellationToken ct = default);
}
