using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Storage;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Application.Services;

public sealed class AiCardSceneUploadService : IAiCardSceneUploadService
{
    #region Fields

    private const long MaxSceneBytes = 52_428_800; // 50 MB

    private static readonly HashSet<string> AllowedExtensions =
    [
        ".jpg", ".jpeg", ".png", ".webp"
    ];

    private static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);

    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly IAiCardSceneRepository _scenes;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardSceneUploadService> _logger;

    #endregion

    #region Constructors

    public AiCardSceneUploadService(
        IAiCardService cards,
        IObjectStorageService storage,
        IAiCardSceneRepository scenes,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardSceneUploadService> logger)
    {
        _cards = cards ?? throw new ArgumentNullException(nameof(cards));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _scenes = scenes ?? throw new ArgumentNullException(nameof(scenes));
        _s3 = s3 ?? throw new ArgumentNullException(nameof(s3));
        _time = time ?? throw new ArgumentNullException(nameof(time));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task<BeginSceneUploadResult> BeginUploadAsync(
        Guid userId,
        Guid cardId,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return BeginSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Object storage is not configured.");

        var validationError = ValidateFileNameAndSize(fileName, sizeBytes);
        if (validationError is not null)
            return BeginSceneUploadResult.Fail(SceneUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return BeginSceneUploadResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");

        var safeName = SanitizeFileName(fileName);
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/scenes/{Guid.NewGuid():N}_{safeName}";
        var ctNormalized = NormalizeContentType(contentType, fileName);

        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, ctNormalized, PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return BeginSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Could not create upload URL.");

        var expiresAt = _time.GetUtcNow().Add(PresignTtl);
        _logger.LogInformation("Presigned scene upload key={Key} card={CardId}", objectKey, cardId);

        return BeginSceneUploadResult.Ok(uploadUrl, objectKey, expiresAt, ctNormalized);
    }

    public async Task<CompleteSceneUploadResult> CompleteUploadAsync(
        Guid userId,
        Guid cardId,
        string storageKey,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return CompleteSceneUploadResult.Fail(SceneUploadError.StorageDisabled, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(storageKey))
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, "storage_key is required.");

        var validationError = ValidateFileNameAndSize(fileName, sizeBytes);
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
            _logger.LogWarning("CompleteSceneUpload: invalid storage key={Key} expected prefix={Prefix}", storageKey, expectedPrefix);
            return CompleteSceneUploadResult.Fail(SceneUploadError.Validation, "Invalid storage key.");
        }

        _logger.LogInformation("CompleteSceneUpload: checking object in storage key={Key}", storageKey);
        var info = await _storage.GetObjectInfoAsync(storageKey, ct).ConfigureAwait(false);
        if (info is null)
        {
            _logger.LogWarning("CompleteSceneUpload: object not found in storage key={Key}", storageKey);
            return CompleteSceneUploadResult.Fail(SceneUploadError.ObjectNotFoundInStorage,
                "Object not found in storage. Upload may have failed.");
        }

        _logger.LogInformation("CompleteSceneUpload: object found size={StoredSize} reported={ReportedSize}", info.SizeBytes, sizeBytes);
        if (info.SizeBytes != sizeBytes)
        {
            _logger.LogWarning("CompleteSceneUpload: size mismatch stored={StoredSize} reported={ReportedSize}", info.SizeBytes, sizeBytes);
            return CompleteSceneUploadResult.Fail(SceneUploadError.SizeMismatch,
                "Reported size does not match stored object.");
        }

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, storageKey);
        var entity = AiCardScene.Create(
            userId,
            cardId,
            storageKey,
            publicUrl,
            SanitizeFileName(fileName),
            NormalizeContentType(contentType, fileName),
            sizeBytes,
            _time.GetUtcNow().UtcDateTime);

        await _scenes.AddAsync(entity, ct).ConfigureAwait(false);
        _logger.LogInformation("Saved ai_card_scenes id={Id} key={Key}", entity.Id, storageKey);

        // Delete previous scenes — one active background per card.
        var previous = await _scenes.ListOthersByCardAsync(userId, cardId, entity.Id, ct).ConfigureAwait(false);
        foreach (var old in previous)
        {
            if (_storage.IsEnabled)
            {
                try { await _storage.DeleteObjectAsync(old.StorageKey, ct).ConfigureAwait(false); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete old scene object key={Key}", old.StorageKey); }
            }
            await _scenes.DeleteAsync(old, ct).ConfigureAwait(false);
            _logger.LogInformation("Deleted old ai_card_scene id={Id} key={Key}", old.Id, old.StorageKey);
        }

        return CompleteSceneUploadResult.Ok(ToDto(entity));
    }

    public async Task<IReadOnlyList<AiCardSceneDto>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return null;

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
            try
            {
                await _storage.DeleteObjectAsync(scene.StorageKey, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete scene object from storage key={Key}, proceeding with DB delete.", scene.StorageKey);
            }
        }

        await _scenes.DeleteAsync(scene, ct).ConfigureAwait(false);
        _logger.LogInformation("Deleted ai_card_scene id={Id} key={Key}", scene.Id, scene.StorageKey);

        return DeleteSceneResult.Ok();
    }

    #endregion

    #region Private Methods

    private static AiCardSceneDto ToDto(AiCardScene s)
        => new(s.Id, s.AiCardId, s.StorageKey, s.PublicUrl, s.OriginalFileName, s.ContentType, s.SizeBytes, s.CreatedAt);

    private static string? ValidateFileNameAndSize(string fileName, long sizeBytes)
    {
        if (sizeBytes <= 0)
            return "size_bytes must be positive.";

        if (sizeBytes > MaxSceneBytes)
            return $"File too large (max {MaxSceneBytes / 1_048_576} MB).";

        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext.ToLowerInvariant()))
            return $"Allowed extensions: {string.Join(", ", AllowedExtensions)}.";

        return null;
    }

    private static string SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "background.jpg";
        var leaf = Path.GetFileName(name);
        return string.IsNullOrEmpty(leaf) ? "background.jpg" : leaf;
    }

    private static string NormalizeContentType(string? contentType, string? fileName)
    {
        if (!string.IsNullOrWhiteSpace(contentType))
            return contentType.Trim();

        return Path.GetExtension(fileName)?.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            ".webp"           => "image/webp",
            _                 => "image/jpeg",
        };
    }

    #endregion
}
