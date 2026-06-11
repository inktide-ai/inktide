namespace Inktide.API.Project.Application.Interfaces;

public record ProjectSceneConfigResult(string? SceneConfigJson, string PersonalityConfigJson);

public interface IProjectSceneConfigService
{
    Task UpdateSceneConfigAsync(Guid projectId, Guid userId, string sceneConfigJson, CancellationToken ct = default);
    Task<ProjectSceneConfigResult?> GetSceneConfigAsync(Guid projectId, CancellationToken ct = default);
}
