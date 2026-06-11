using Inktide.API.Core.Pagination;
using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectCrudService
{
    Task<IReadOnlyList<ProjectEntity>> ListAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectEntity>> ListBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default);
    Task<PagedResult<ProjectEntity>> ListPagedAsync(Guid userId, int limit, string? cursor, CancellationToken ct = default);
    Task<PagedResult<ProjectEntity>> ListBySoulPagedAsync(Guid userId, Guid soulId, int limit, string? cursor, CancellationToken ct = default);
    Task<ProjectEntity?> GetAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> CreateAsync(Guid userId, string name, string? description, Guid? activeSoulId, string? personality = null, string? personalityConfig = null, string? responseBehavior = null, string? screenAwarenessSettings = null, CancellationToken ct = default);
    Task<ProjectEntity> UpdateAsync(Guid id, Guid userId, string name, string? description, string? status, Guid? activeModelId, Guid? activeSceneId, string? systemPrompt = null, string? personality = null, string? personalityConfig = null, string? responseBehavior = null, string? screenAwarenessSettings = null, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> BindSoulAsync(Guid id, Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity> UnbindSoulAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task SetActiveSceneAsync(Guid id, Guid userId, Guid? sceneId, CancellationToken ct = default);
    Task<ProjectEntity> UpdateSkillsAsync(Guid id, Guid userId, string? systemPrompt, string? behaviorSettings, string? memorySettings, string? autoPilot, CancellationToken ct = default);
    Task<ProjectEntity> ResetSystemPromptAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task SetPreviewUrlAsync(Guid id, Guid userId, string previewUrl, CancellationToken ct = default);
}
