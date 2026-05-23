using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectCrudService
{
    Task<IReadOnlyList<ProjectEntity>> ListAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectEntity>> ListBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity?> GetAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> CreateAsync(Guid userId, string name, string? description, Guid? activeSoulId, CancellationToken ct = default);
    Task<ProjectEntity> UpdateAsync(Guid id, Guid userId, string name, string? description, string? status, Guid? activeModelId, Guid? activeSceneId, string? systemPrompt = null, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> BindSoulAsync(Guid id, Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity> UnbindSoulAsync(Guid id, Guid userId, CancellationToken ct = default);
}
