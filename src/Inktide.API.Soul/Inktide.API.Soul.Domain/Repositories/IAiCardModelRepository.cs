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

    /// <summary>Sets is_active = false for every model in the card in a single UPDATE.</summary>
    Task DeactivateAllByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    /// <summary>Sets is_active = true for a specific model in a single UPDATE.</summary>
    Task ActivateByIdAsync(Guid userId, Guid aiCardId, Guid modelId, CancellationToken ct = default);

    /// <summary>Returns the currently active model for the card, or null if none is marked active.</summary>
    Task<AiCardModel?> GetActiveByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    /// <summary>Persists a generated thumbnail URL for a specific model.</summary>
    Task SetThumbnailUrlAsync(Guid userId, Guid aiCardId, Guid modelId, string thumbnailUrl, CancellationToken ct = default);
}
