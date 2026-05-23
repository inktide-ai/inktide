using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Domain.Repositories;

public interface IProjectRepository
{
    Task<ProjectEntity?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProjectEntity?> FindByIdAndUserAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectEntity>> FindByUserAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectEntity>> FindBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken ct = default);
    Task<ProjectEntity> UpdateAsync(ProjectEntity project, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);

    /// <summary>Returns all (id, sort_key) pairs for the user ordered by sort_key ASC.</summary>
    Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Updates sort_key for each entry in the list.</summary>
    Task BulkUpdateSortKeysAsync(IReadOnlyList<(Guid Id, string SortKey)> updates, CancellationToken ct = default);
}
