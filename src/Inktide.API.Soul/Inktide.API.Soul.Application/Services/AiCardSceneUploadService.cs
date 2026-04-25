using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;
using AiCardSceneEntity = Inktide.API.Soul.Domain.Entities.AiCardScene;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Two-phase (presign → complete) scene image upload, list, and delete.
/// ISP: implements IAiCardSceneService only — tag management is in AiCardSceneTagService.
/// SRP: upload concerns (file validation, presign, storage check, persistence) only.
/// OCP: changing allowed extensions or size limits means updating the static Constraints field,
///      or registering a new IAiCardSceneService — this class is otherwise closed for modification.
/// </summary>
public sealed class AiCardSceneUploadService : IAiCardSceneService
{
    private static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);

    private static readonly UploadConstraints Constraints = new()
    {
        MaxBytes          = 52_428_800,
        AllowedExtensions = new HashSet<string> { ".jpg", ".jpeg", ".png", ".webp" },
        FallbackFileName  = "background.jpg",
    };

    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly IAiCardSceneRepository _scenes;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardSceneUploadService> _logger;

    public AiCardSceneUploadService(
        IAiCardService cards,
        IObjectStorageService storage,
        IAiCardSceneRepository scenes,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardSceneUploadService> logger)
    {
        _cards   = cards   ?? throw new ArgumentNullException(nameof(cards));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _scenes  = scenes  ?? throw new ArgumentNullException(nameof(scenes));
        _s3      = s3      ?? throw new ArgumentNullException(nameof(s3));
        _time    = time    ?? throw new ArgumentNullException(nameof(time));
        _logger  = logger  ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<BeginSceneUploadResult> BeginUploadAsync(
        Guid userId, Guid cardId, string fileName, string contentType, long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return BeginSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Object storage is not configured.");

        var validationError = Constraints.Validate(fileName, sizeBytes);
        if (validationError is not null)
            return BeginSceneUploadResult.Fail(SceneUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return BeginSceneUploadResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, Constraints.FallbackFileName);
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/scenes/{Guid.NewGuid():N}_{safeName}";
        var ctNorm    = StorageFileHelper.InferContentType(contentType, fileName, "image/jpeg");

        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, ctNorm, PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return BeginSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Could not create upload URL.");

        _logger.LogInformation("Presigned scene upload key={Key} card={CardId}", objectKey, cardId);
        return BeginSceneUploadResult.Ok(uploadUrl, objectKey, _time.GetUtcNow().Add(PresignTtl), ctNorm);
    }

    public async Task<CompleteSceneUploadResult> CompleteUploadAsync(
        Guid userId, Guid cardId, string storageKey, string fileName, string contentType,
        long sizeBytes, string? tag = null, CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return CompleteSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(storageKey))
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, "storage_key is required.");

        var tagError = TryNormalizeTag(tag, out var normalizedTag);
        if (tagError is not null)
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, tagError);

        var validationError = Constraints.Validate(fileName, sizeBytes);
        if (validationError is not null)
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
        {
            _logger.LogWarning("CompleteSceneUpload: card not found cardId={CardId} userId={UserId}", cardId, userId);
            return CompleteSceneUploadResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");
        }

        var expectedPrefix = $"users/{userId:N}/cards/{cardId:N}/scenes/";
        if (!storageKey.StartsWith(expectedPrefix, StringComparison.Ordinal))
        {
            _logger.LogWarning("CompleteSceneUpload: invalid key={Key} prefix={Prefix}", storageKey, expectedPrefix);
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, "Invalid storage key.");
        }

        var info = await _storage.GetObjectInfoAsync(storageKey, ct).ConfigureAwait(false);
        if (info is null)
        {
            _logger.LogWarning("CompleteSceneUpload: object not found key={Key}", storageKey);
            return CompleteSceneUploadResult.Fail(SceneUploadError.ObjectNotFoundInStorage,
                "Object not found in storage. Upload may have failed.");
        }

        if (info.SizeBytes != sizeBytes)
        {
            _logger.LogWarning("CompleteSceneUpload: size mismatch stored={S} reported={R}", info.SizeBytes, sizeBytes);
            return CompleteSceneUploadResult.Fail(SceneUploadError.SizeMismatch,
                "Reported size does not match stored object.");
        }

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, storageKey);
        var entity = AiCardSceneEntity.Create(
            userId, cardId, storageKey, publicUrl,
            StorageFileHelper.SanitizeFileName(fileName, Constraints.FallbackFileName),
            StorageFileHelper.InferContentType(contentType, fileName, "image/jpeg"),
            sizeBytes,
            _time.GetUtcNow().UtcDateTime,
            normalizedTag);

        await _scenes.AddAsync(entity, ct).ConfigureAwait(false);
        _logger.LogInformation("Saved ai_card_scenes id={Id} key={Key}", entity.Id, storageKey);

        return CompleteSceneUploadResult.Ok(ToDto(entity));
    }

    public async Task<IReadOnlyList<AiCardScene>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null) return null;

        var list = await _scenes.ListByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        return list.Select(ToDto).ToList();
    }

    public async Task<DeleteSceneResult> DeleteAsync(Guid userId, Guid cardId, Guid sceneId, CancellationToken ct = default)
    {
        var scene = await _scenes.GetByIdAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);
        if (scene is null)
            return DeleteSceneResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.");

        if (_storage.IsEnabled)
        {
            try { await _storage.DeleteObjectAsync(scene.StorageKey, ct).ConfigureAwait(false); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete scene object key={Key}, proceeding with DB delete.", scene.StorageKey);
            }
        }

        await _scenes.DeleteAsync(scene, ct).ConfigureAwait(false);
        _logger.LogInformation("Deleted ai_card_scene id={Id} key={Key}", scene.Id, scene.StorageKey);

        return DeleteSceneResult.Ok();
    }


    private static AiCardScene ToDto(AiCardSceneEntity s) =>
        new(s.Id, s.AiCardId, s.StorageKey, s.PublicUrl, s.OriginalFileName,
            s.ContentType, s.SizeBytes, s.CreatedAt, s.Tag, s.DisplayName, s.Description);

    private static string? TryNormalizeTag(string? tag, out string? normalized)
    {
        normalized = null;
        if (tag is null || string.IsNullOrWhiteSpace(tag)) return null;
        var t = tag.Trim();
        if (t.Length > 128) return "tag must be at most 128 characters.";
        normalized = t;
        return null;
    }
}
