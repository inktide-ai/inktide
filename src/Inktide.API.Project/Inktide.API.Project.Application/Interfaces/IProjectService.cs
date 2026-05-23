using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.ValueObjects;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectEntity>> ListAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectEntity>> ListBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity?> GetAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> CreateAsync(Guid userId, string name, string? description, Guid? activeSoulId, CancellationToken ct = default);
    Task<ProjectEntity> UpdateAsync(Guid id, Guid userId, string name, string? description, string? status, Guid? activeModelId, Guid? activeSceneId, string? systemPrompt = null, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectEntity> BindSoulAsync(Guid id, Guid userId, Guid soulId, CancellationToken ct = default);
    Task<ProjectEntity> UnbindSoulAsync(Guid id, Guid userId, CancellationToken ct = default);

    /// <summary>Move a project to a new position. previousId=null → beginning; nextId=null → end. Returns null when not found.</summary>
    Task<ProjectEntity?> ReorderAsync(Guid id, Guid userId, Guid? previousId, Guid? nextId, CancellationToken ct = default);

    Task<IReadOnlyList<ProjectPlugin>> GetPluginsAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectPlugin> UpsertPluginAsync(Guid id, Guid userId, string pluginId, bool isEnabled, Dictionary<string, string>? config, CancellationToken ct = default);
}
