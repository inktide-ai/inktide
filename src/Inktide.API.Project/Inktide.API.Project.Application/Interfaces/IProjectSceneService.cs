using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public sealed record ScenePresignResult(
    string UploadUrl,
    string StorageKey,
    DateTimeOffset ExpiresAt,
    string RequiredContentType);

public sealed record CompleteSceneUploadCommand(
    string StorageKey,
    string FileName,
    string ContentType,
    long SizeBytes,
    string? DisplayName);

public interface IProjectSceneService
{
    Task<IReadOnlyList<ProjectScene>> ListAsync(Guid projectId, CancellationToken ct = default);
    Task<ProjectScene?> GetByIdAsync(Guid sceneId, CancellationToken ct = default);
    Task<ScenePresignResult> PresignAsync(Guid projectId, Guid userId, string fileName, string contentType, long sizeBytes, CancellationToken ct = default);
    Task<ProjectScene> CompleteUploadAsync(Guid projectId, Guid userId, CompleteSceneUploadCommand command, CancellationToken ct = default);
    Task ReorderAsync(Guid sceneId, Guid? previousId, Guid? nextId, CancellationToken ct = default);
    Task DeleteAsync(Guid projectId, Guid sceneId, Guid userId, CancellationToken ct = default);
}
