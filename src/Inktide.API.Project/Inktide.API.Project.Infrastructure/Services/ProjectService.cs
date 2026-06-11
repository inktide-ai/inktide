using Inktide.API.Core.Ordering;
using Inktide.API.Core.Pagination;
using Inktide.API.Core.Transactions;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Project.Domain.ValueObjects;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class ProjectService : IProjectCrudService, IProjectOrderingService, IProjectPluginService, IProjectSceneConfigService
{
    private readonly IProjectRepository  _repo;
    private readonly ITransactionManager _transactionManager;
    private readonly TimeProvider        _time;

    public ProjectService(IProjectRepository repo, ITransactionManager transactionManager, TimeProvider time)
    {
        _repo               = repo               ?? throw new ArgumentNullException(nameof(repo));
        _transactionManager = transactionManager ?? throw new ArgumentNullException(nameof(transactionManager));
        _time               = time               ?? throw new ArgumentNullException(nameof(time));
    }

    public Task<IReadOnlyList<ProjectEntity>> ListAsync(Guid userId, CancellationToken ct = default)
        => _repo.FindByUserAsync(userId, ct);

    public Task<IReadOnlyList<ProjectEntity>> ListBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default)
        => _repo.FindBySoulAsync(userId, soulId, ct);

    public async Task<PagedResult<ProjectEntity>> ListPagedAsync(
        Guid userId, int limit, string? cursor, CancellationToken ct = default)
    {
        var (items, hasMore) = await _repo.FindPagedByUserAsync(userId, limit, cursor, ct);
        var nextCursor = hasMore && items.Count > 0 ? items[^1].SortKey : null;
        return new PagedResult<ProjectEntity>(items, nextCursor, hasMore);
    }

    public async Task<PagedResult<ProjectEntity>> ListBySoulPagedAsync(
        Guid userId, Guid soulId, int limit, string? cursor, CancellationToken ct = default)
    {
        var (items, hasMore) = await _repo.FindPagedBySoulAsync(userId, soulId, limit, cursor, ct);
        var nextCursor = hasMore && items.Count > 0 ? items[^1].SortKey : null;
        return new PagedResult<ProjectEntity>(items, nextCursor, hasMore);
    }

    public Task<ProjectEntity?> GetAsync(Guid id, Guid userId, CancellationToken ct = default)
        => _repo.FindByIdAndUserAsync(id, userId, ct);

    public async Task<ProjectEntity> CreateAsync(Guid userId, string name, string? description, Guid? activeSoulId, string? personality = null, string? personalityConfig = null, string? responseBehavior = null, string? screenAwarenessSettings = null, CancellationToken ct = default)
    {
        var sortKeys = await _repo.GetSortKeysAsync(userId, ct).ConfigureAwait(false);
        var sortKey  = FractionalIndexer.GenerateKeyBetween(
            sortKeys.Count > 0 ? sortKeys[^1].SortKey : null, null);

        var project = ProjectEntity.Create(userId, name, description, activeSoulId);
        project.SortKey = sortKey;
        if (personality is not null)              project.Personality             = personality;
        if (personalityConfig is not null)        project.PersonalityConfig       = personalityConfig;
        if (responseBehavior is not null)         project.ResponseBehavior        = responseBehavior;
        if (screenAwarenessSettings is not null)  project.ScreenAwarenessSettings = screenAwarenessSettings;
        return await _repo.CreateAsync(project, ct).ConfigureAwait(false);
    }

    public async Task<ProjectEntity> UpdateAsync(Guid id, Guid userId, string name, string? description, string? status, Guid? activeModelId, Guid? activeSceneId, string? systemPrompt = null, string? personality = null, string? personalityConfig = null, string? responseBehavior = null, string? screenAwarenessSettings = null, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        project.Name          = name;
        project.Description   = description;
        if (status is not null)
            project.Status    = status;
        project.ActiveModelId = activeModelId;
        project.ActiveSceneId = activeSceneId;
        project.SystemPrompt  = systemPrompt;
        if (personality is not null)              project.Personality             = personality;
        if (personalityConfig is not null)        project.PersonalityConfig       = personalityConfig;
        if (responseBehavior is not null)         project.ResponseBehavior        = responseBehavior;
        if (screenAwarenessSettings is not null)  project.ScreenAwarenessSettings = screenAwarenessSettings;
        project.UpdatedAt     = _time.GetUtcNow().UtcDateTime;

        return await _repo.UpdateAsync(project, ct);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");
        await _repo.DeleteAsync(project.Id, ct);
    }

    public async Task<ProjectEntity> BindSoulAsync(Guid id, Guid userId, Guid soulId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        project.ActiveSoulId = soulId;
        project.UpdatedAt    = _time.GetUtcNow().UtcDateTime;

        return await _repo.UpdateAsync(project, ct);
    }

    public async Task<ProjectEntity> UnbindSoulAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        project.ActiveSoulId = null;
        project.UpdatedAt    = _time.GetUtcNow().UtcDateTime;

        return await _repo.UpdateAsync(project, ct);
    }

    public async Task SetActiveSceneAsync(Guid id, Guid userId, Guid? sceneId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        project.ActiveSceneId = sceneId;
        project.UpdatedAt     = _time.GetUtcNow().UtcDateTime;

        await _repo.UpdateAsync(project, ct);
    }

    public async Task<ProjectEntity> UpdateSkillsAsync(Guid id, Guid userId, string? systemPrompt, string? behaviorSettings, string? memorySettings, string? autoPilot, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        if (systemPrompt is not null)     project.SystemPrompt     = systemPrompt;
        if (behaviorSettings is not null) project.BehaviorSettings = behaviorSettings;
        if (memorySettings is not null)   project.MemorySettings   = memorySettings;
        if (autoPilot is not null)        project.AutoPilot        = autoPilot;
        project.UpdatedAt = _time.GetUtcNow().UtcDateTime;

        return await _repo.UpdateAsync(project, ct);
    }

    public async Task<ProjectEntity> ResetSystemPromptAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");
        project.SystemPrompt = null;
        project.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        return await _repo.UpdateAsync(project, ct);
    }

    public async Task SetPreviewUrlAsync(Guid id, Guid userId, string previewUrl, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");
        project.PreviewUrl = previewUrl;
        project.UpdatedAt  = _time.GetUtcNow().UtcDateTime;
        await _repo.UpdateAsync(project, ct);
    }

    public async Task<IReadOnlyList<ProjectPlugin>> GetPluginsAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");
        return project.Plugins;
    }

    public async Task<ProjectPlugin> UpsertPluginAsync(Guid id, Guid userId, string pluginId, bool isEnabled, Dictionary<string, string>? config, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        var plugins = project.Plugins;
        var idx     = plugins.FindIndex(p => p.PluginId == pluginId);
        var plugin  = new ProjectPlugin(pluginId, isEnabled, config ?? []);

        if (idx >= 0) plugins[idx] = plugin;
        else          plugins.Add(plugin);
        project.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        await _repo.UpdateAsync(project, ct);
        return plugin;
    }

    public async Task UpdateSceneConfigAsync(Guid projectId, Guid userId, string sceneConfigJson, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(projectId, userId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");
        project.SceneConfig = sceneConfigJson;
        project.UpdatedAt   = _time.GetUtcNow().UtcDateTime;
        await _repo.UpdateAsync(project, ct);
    }

    public async Task<ProjectSceneConfigResult?> GetSceneConfigAsync(Guid projectId, CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAsync(projectId, ct);
        if (project is null) return null;
        return new ProjectSceneConfigResult(project.SceneConfig, project.PersonalityConfig);
    }

    public async Task<ProjectEntity?> ReorderAsync(
        Guid id, Guid userId,
        Guid? previousId, Guid? nextId,
        CancellationToken ct = default)
    {
        var project = await _repo.FindByIdAndUserAsync(id, userId, ct).ConfigureAwait(false);
        if (project is null) return null;

        var sortKeys = await _repo.GetSortKeysAsync(userId, ct).ConfigureAwait(false);

        string? prevKey = previousId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == previousId.Value).SortKey
            : null;
        string? nextKey = nextId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == nextId.Value).SortKey
            : null;

        string newKey = FractionalIndexer.GenerateKeyBetween(prevKey, nextKey);

        await _transactionManager.BeginTransactionAsync(ct).ConfigureAwait(false);
        await _repo.BulkUpdateSortKeysAsync(userId, [(id, newKey)], _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        await _transactionManager.CommitTransactionAsync(ct).ConfigureAwait(false);

        project.SortKey = newKey;
        return project;
    }
}
