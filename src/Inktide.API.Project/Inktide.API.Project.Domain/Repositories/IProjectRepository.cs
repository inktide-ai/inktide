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

    Task<(IReadOnlyList<ProjectEntity> Items, bool HasMore)> FindPagedByUserAsync(
        Guid userId, int limit, string? cursor, CancellationToken ct = default);

    Task<(IReadOnlyList<ProjectEntity> Items, bool HasMore)> FindPagedBySoulAsync(
        Guid userId, Guid soulId, int limit, string? cursor, CancellationToken ct = default);

    /// <summary>Returns all (id, sort_key) pairs for the user ordered by sort_key ASC.</summary>
    Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Updates sort_key for each entry in the list. Only rows matching userId are affected. Caller is responsible for the surrounding transaction.</summary>
    Task BulkUpdateSortKeysAsync(Guid userId, IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default);
}
