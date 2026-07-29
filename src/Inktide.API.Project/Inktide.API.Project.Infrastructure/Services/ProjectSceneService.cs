using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Core.Ordering;
using Inktide.API.Core.Storage;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Project.Infrastructure.Services;

public sealed class ProjectSceneService : IProjectSceneService
{
    private static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);
    private const long MaxBytes = 50 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    private readonly IProjectSceneRepository _sceneRepo;
    private readonly IProjectCrudService _projects;
    private readonly IObjectStorageService _storage;
    private readonly ObjectStorageSettings _s3;
    private readonly ILogger<ProjectSceneService> _logger;

    public ProjectSceneService(
        IProjectSceneRepository sceneRepo,
        IProjectCrudService projects,
        IObjectStorageService storage,
        ObjectStorageSettings s3,
        ILogger<ProjectSceneService> logger)
    {
        _sceneRepo = sceneRepo ?? throw new ArgumentNullException(nameof(sceneRepo));
        _projects  = projects  ?? throw new ArgumentNullException(nameof(projects));
        _storage   = storage   ?? throw new ArgumentNullException(nameof(storage));
        _s3        = s3        ?? throw new ArgumentNullException(nameof(s3));
        _logger    = logger    ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task<IReadOnlyList<ProjectScene>> ListAsync(Guid projectId, CancellationToken ct = default)
        => _sceneRepo.GetByProjectAsync(projectId, ct);

    public Task<ProjectScene?> GetByIdAsync(Guid sceneId, CancellationToken ct = default)
        => _sceneRepo.GetByIdAsync(sceneId, ct);

    public Task<ScenePresignResult> PresignAsync(Guid projectId, Guid userId, string fileName, string contentType, long sizeBytes, CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            throw new InvalidOperationException("Object storage not configured.");

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new ArgumentException($"Extension {ext} not allowed. Use jpg, png or webp.", nameof(fileName));

        if (sizeBytes > MaxBytes)
            throw new ArgumentOutOfRangeException(nameof(sizeBytes), $"File too large. Max {MaxBytes / 1024 / 1024} MB.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, "background.jpg");
        var objectKey = $"users/{userId:N}/projects/{projectId:N}/scenes/{IdGenerator.New():N}_{safeName}";
        var ct0       = StorageFileHelper.InferContentType(contentType, fileName, "image/jpeg");

        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, ct0, PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            throw new InvalidOperationException("Could not create upload URL.");

        return Task.FromResult(new ScenePresignResult(uploadUrl, objectKey, DateTimeOffset.UtcNow.Add(PresignTtl), ct0));
    }

    public async Task<ProjectScene> CompleteUploadAsync(Guid projectId, Guid userId, CompleteSceneUploadCommand command, CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            throw new InvalidOperationException("Object storage not configured.");

        var expectedPrefix = $"users/{userId:N}/projects/{projectId:N}/scenes/";
        if (!command.StorageKey.StartsWith(expectedPrefix, StringComparison.Ordinal))
            throw new ArgumentException("Invalid storage key.", nameof(command));

        var info = await _storage.GetObjectInfoAsync(command.StorageKey, ct);
        if (info is null)
            throw new InvalidOperationException("Object not found in storage. Upload may have failed.");

        var sortKeys = await _sceneRepo.GetSortKeysAsync(projectId, ct);
        var sortKey  = FractionalIndexer.GenerateKeyBetween(sortKeys.Count > 0 ? sortKeys[^1].SortKey : null, null);

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, command.StorageKey);
        var safeName  = StorageFileHelper.SanitizeFileName(command.FileName, "background.jpg");
        var ctNorm    = StorageFileHelper.InferContentType(command.ContentType, command.FileName, "image/jpeg");

        var scene = new ProjectScene
        {
            Id           = IdGenerator.New(),
            ProjectId    = projectId,
            StorageKey   = command.StorageKey,
            PublicUrl    = publicUrl,
            OriginalName = safeName,
            ContentType  = ctNorm,
            SizeBytes    = info.SizeBytes,
            DisplayName  = command.DisplayName,
            SortKey      = sortKey,
            CreatedAt    = DateTimeOffset.UtcNow,
        };

        return await _sceneRepo.CreateAsync(scene, ct);
    }

    public async Task ReorderAsync(Guid sceneId, Guid? previousId, Guid? nextId, CancellationToken ct = default)
    {
        var scene = await _sceneRepo.GetByIdAsync(sceneId, ct)
            ?? throw new InvalidOperationException($"Scene {sceneId} not found.");

        var sortKeys = await _sceneRepo.GetSortKeysAsync(scene.ProjectId, ct);
        var prevKey  = previousId.HasValue ? sortKeys.FirstOrDefault(x => x.Id == previousId.Value).SortKey : null;
        var nextKey  = nextId.HasValue     ? sortKeys.FirstOrDefault(x => x.Id == nextId.Value).SortKey     : null;
        var newKey   = FractionalIndexer.GenerateKeyBetween(prevKey, nextKey);

        await _sceneRepo.UpdateSortKeyAsync(sceneId, newKey, ct);
    }

    public async Task DeleteAsync(Guid projectId, Guid sceneId, Guid userId, CancellationToken ct = default)
    {
        var scene = await _sceneRepo.GetByIdAsync(sceneId, ct);
        if (scene is null || scene.ProjectId != projectId) return;

        var project = await _projects.GetAsync(projectId, userId, ct);
        if (project?.ActiveSceneId == sceneId)
            await _projects.SetActiveSceneAsync(projectId, userId, null, ct);

        if (_storage.IsEnabled && !string.IsNullOrEmpty(scene.StorageKey))
        {
            try { await _storage.DeleteObjectAsync(scene.StorageKey, ct); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete storage object for scene {SceneId}, key={Key}", sceneId, scene.StorageKey);
            }
        }

        await _sceneRepo.DeleteAsync(sceneId, ct);
    }
}
