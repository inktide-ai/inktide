using Chimera.API.Soul.Domain.Entities;

namespace Chimera.API.Soul.Domain.Repositories;

public interface IAiCardCustomSceneTagRepository
{
    Task<IReadOnlyList<(string Label, string? Color)>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default);

    Task<bool> ExistsNormalizedAsync(Guid userId, Guid aiCardId, string labelNormalized, CancellationToken ct = default);

    Task AddAsync(AiCardCustomSceneTag row, CancellationToken ct = default);
}
