using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Domain.Repositories;

public interface IProjectSceneRepository
{
    Task<IReadOnlyList<ProjectScene>> GetByProjectAsync(Guid projectId, CancellationToken ct);
    Task<ProjectScene?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ProjectScene> CreateAsync(ProjectScene scene, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<(Guid Id, string? SortKey)>> GetSortKeysAsync(Guid projectId, CancellationToken ct);
    Task UpdateSortKeyAsync(Guid sceneId, string sortKey, CancellationToken ct);
}
