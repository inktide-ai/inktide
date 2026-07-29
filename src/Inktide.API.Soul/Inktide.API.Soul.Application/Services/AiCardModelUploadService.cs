using Inktide.API.Core.Generators;
using Inktide.API.Core.Transactions;
using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Constants;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;
using AiCardModelEntity = Inktide.API.Soul.Domain.Entities.AiCardModel;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Orchestrates two-phase (presign -> complete) model uploads.
/// SRP: upload flow only - retention policy delegated to IModelRetentionPolicy.
/// OCP: changing the "how many models to keep" rule means swapping IModelRetentionPolicy registration.
/// DIP: depends on IModelRetentionPolicy and StorageFileHelper abstractions, not on their implementations.
/// </summary>
public sealed class AiCardModelUploadService : IAiCardModelUploadService
{
    private static readonly UploadConstraints Constraints = new()
    {
        MaxBytes           = SoulConstants.Upload.MaxModelBytes,
        AllowedExtensions  = new HashSet<string> { ".vrm", ".glb", ".gltf", ".zip", ".json" },
        FallbackFileName   = "model.bin",
    };

    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly IAiCardModelRepository _models;
    private readonly IModelRetentionPolicy _retentionPolicy;
    private readonly ITransactionManager _txManager;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardModelUploadService> _logger;

    public AiCardModelUploadService(
        IAiCardService cards,
        IObjectStorageService storage,
        IAiCardModelRepository models,
        IModelRetentionPolicy retentionPolicy,
        ITransactionManager txManager,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardModelUploadService> logger)
    {
        _cards           = cards           ?? throw new ArgumentNullException(nameof(cards));
        _storage         = storage         ?? throw new ArgumentNullException(nameof(storage));
        _models          = models          ?? throw new ArgumentNullException(nameof(models));
        _retentionPolicy = retentionPolicy ?? throw new ArgumentNullException(nameof(retentionPolicy));
        _txManager       = txManager       ?? throw new ArgumentNullException(nameof(txManager));
        _s3              = s3              ?? throw new ArgumentNullException(nameof(s3));
        _time            = time            ?? throw new ArgumentNullException(nameof(time));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<BeginModelUploadResult> BeginUploadAsync(
        Guid userId, Guid cardId, string fileName, string contentType, long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return BeginModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Object storage is not configured.");

        var validationError = Constraints.Validate(fileName, sizeBytes);
        if (validationError is not null)
            return BeginModelUploadResult.Fail(ModelUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return BeginModelUploadResult.Fail(ModelUploadError.CardNotFound, "AI card not found.");

        var existingCount = await _models.CountByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        if (existingCount >= SoulConstants.Upload.MaxModelsPerCard)
            return BeginModelUploadResult.Fail(ModelUploadError.Validation,
                $"Model limit reached ({SoulConstants.Upload.MaxModelsPerCard} per card).");

        var safeName    = StorageFileHelper.SanitizeFileName(fileName, Constraints.FallbackFileName);
        var objectKey   = $"users/{userId:N}/cards/{cardId:N}/models/{IdGenerator.New():N}_{safeName}";
        var ctNorm      = StorageFileHelper.InferContentType(contentType, fileName, "application/octet-stream");

        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, ctNorm, SoulConstants.Upload.PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return BeginModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Could not create upload URL.");

        _logger.LogInformation("Presigned model upload key={Key} card={CardId}", objectKey, cardId);
        return BeginModelUploadResult.Ok(uploadUrl, objectKey, _time.GetUtcNow().Add(SoulConstants.Upload.PresignTtl), ctNorm);
    }

    public async Task<CompleteModelUploadResult> CompleteUploadAsync(
        Guid userId, Guid cardId, string storageKey, string fileName, string contentType, long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return CompleteModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(storageKey))
            return CompleteModelUploadResult.Fail(ModelUploadError.Validation, "storage_key is required.");

        var validationError = Constraints.Validate(fileName, sizeBytes);
        if (validationError is not null)
            return CompleteModelUploadResult.Fail(ModelUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
        {
            _logger.LogWarning("CompleteUpload: card not found cardId={CardId} userId={UserId}", cardId, userId);
            return CompleteModelUploadResult.Fail(ModelUploadError.CardNotFound, "AI card not found.");
        }

        var expectedPrefix = $"users/{userId:N}/cards/{cardId:N}/models/";
        if (!storageKey.StartsWith(expectedPrefix, StringComparison.Ordinal))
        {
            _logger.LogWarning("CompleteUpload: invalid storage key={Key} expected prefix={Prefix}", storageKey, expectedPrefix);
            return CompleteModelUploadResult.Fail(ModelUploadError.Validation, "Invalid storage key.");
        }

        var info = await _storage.GetObjectInfoAsync(storageKey, ct).ConfigureAwait(false);
        if (info is null)
        {
            _logger.LogWarning("CompleteUpload: object not found in storage key={Key}", storageKey);
            return CompleteModelUploadResult.Fail(ModelUploadError.ObjectNotFoundInStorage,
                "Object not found in storage. Upload may have failed.");
        }

        if (info.SizeBytes != sizeBytes)
        {
            _logger.LogWarning("CompleteUpload: size mismatch stored={StoredSize} reported={ReportedSize}", info.SizeBytes, sizeBytes);
            return CompleteModelUploadResult.Fail(ModelUploadError.SizeMismatch,
                "Reported size does not match stored object.");
        }

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, storageKey);
        var entity = AiCardModelEntity.Create(
            userId, cardId, storageKey, publicUrl,
            StorageFileHelper.SanitizeFileName(fileName, Constraints.FallbackFileName),
            StorageFileHelper.InferContentType(contentType, fileName, "application/octet-stream"),
            sizeBytes,
            _time.GetUtcNow().UtcDateTime,
            isActive: true);

        // DeactivateAllByCardAsync uses ExecuteUpdateAsync (bypasses change tracker - commits immediately).
        // AddAsync stages the new entity in the change tracker.
        // Both must be inside one explicit transaction so a SaveChangesAsync failure doesn't
        // leave all models deactivated with no new active model.
        await _txManager.BeginTransactionAsync(ct).ConfigureAwait(false);
        try
        {
            await _models.DeactivateAllByCardAsync(userId, cardId, ct).ConfigureAwait(false);
            await _models.AddAsync(entity, ct).ConfigureAwait(false);
            await _txManager.CommitTransactionAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await _txManager.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
        _logger.LogInformation("Saved ai_card_models id={Id} key={Key}", entity.Id, storageKey);

        await _retentionPolicy.EnforceAsync(userId, cardId, entity.Id, ct).ConfigureAwait(false);

        return CompleteModelUploadResult.Ok(ToDto(entity));
    }

    public async Task<IReadOnlyList<AiCardModel>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null) return null;

        var list = await _models.ListByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        return list.Select(ToDto).ToList();
    }

    public async Task<DeleteModelResult> DeleteAsync(Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default)
    {
        var model = await _models.GetByIdAsync(userId, cardId, modelId, ct).ConfigureAwait(false);
        if (model is null)
            return DeleteModelResult.Fail(ModelUploadError.ModelNotFound, "Model not found.");

        if (_storage.IsEnabled)
        {
            try { await _storage.DeleteObjectAsync(model.StorageKey, ct).ConfigureAwait(false); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteAsync: storage deletion failed for key={Key} — aborting DB delete", model.StorageKey);
                return DeleteModelResult.Fail(ModelUploadError.StorageDisabled, "File deletion from storage failed. Please retry.");
            }
        }

        await _models.DeleteAsync(model, ct).ConfigureAwait(false);
        _logger.LogInformation("Deleted ai_card_models id={Id} key={Key}", model.Id, model.StorageKey);

        return DeleteModelResult.Ok();
    }

    public async Task<SetActiveModelResult> SetActiveAsync(Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default)
    {
        var exists = await _models.GetByIdAsync(userId, cardId, modelId, ct).ConfigureAwait(false);
        if (exists is null)
            return SetActiveModelResult.Fail(ModelUploadError.ModelNotFound, "Model not found.");

        // Both are ExecuteUpdateAsync (bypass change tracker - each commits immediately without explicit tx).
        await _txManager.BeginTransactionAsync(ct).ConfigureAwait(false);
        try
        {
            await _models.DeactivateAllByCardAsync(userId, cardId, ct).ConfigureAwait(false);
            await _models.ActivateByIdAsync(userId, cardId, modelId, ct).ConfigureAwait(false);
            await _txManager.CommitTransactionAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await _txManager.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
        _logger.LogInformation("Set active ai_card_model id={Id} card={CardId}", modelId, cardId);

        return SetActiveModelResult.Ok();
    }

    public async Task<PresignThumbnailResult> PresignThumbnailAsync(
        Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return PresignThumbnailResult.Fail(ModelUploadError.StorageDisabled, "Object storage is not configured.");

        var model = await _models.GetByIdAsync(userId, cardId, modelId, ct).ConfigureAwait(false);
        if (model is null)
            return PresignThumbnailResult.Fail(ModelUploadError.ModelNotFound, "Model not found.");

        var objectKey = $"thumbnails/{userId:N}/{cardId:N}/{modelId:N}.webp";
        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, "image/webp", SoulConstants.Upload.PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return PresignThumbnailResult.Fail(ModelUploadError.StorageDisabled, "Could not create upload URL.");

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, objectKey);
        return PresignThumbnailResult.Ok(uploadUrl, publicUrl);
    }

    public async Task<SaveThumbnailResult> SaveThumbnailAsync(
        Guid userId, Guid cardId, Guid modelId, string publicUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(publicUrl))
            return SaveThumbnailResult.Fail(ModelUploadError.Validation, "public_url is required.");

        var model = await _models.GetByIdAsync(userId, cardId, modelId, ct).ConfigureAwait(false);
        if (model is null)
            return SaveThumbnailResult.Fail(ModelUploadError.ModelNotFound, "Model not found.");

        var expectedKey = $"thumbnails/{userId:N}/{cardId:N}/{modelId:N}.webp";
        var expectedUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, expectedKey);
        if (!string.Equals(publicUrl.TrimEnd('/'), expectedUrl.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("SaveThumbnail: URL mismatch expected={Expected} got={Got}", expectedUrl, publicUrl);
            return SaveThumbnailResult.Fail(ModelUploadError.Validation, "Invalid thumbnail URL.");
        }

        await _models.SetThumbnailUrlAsync(userId, cardId, modelId, publicUrl, ct).ConfigureAwait(false);
        _logger.LogInformation("Saved thumbnail for model={ModelId} card={CardId}", modelId, cardId);
        return SaveThumbnailResult.Ok();
    }

    private static AiCardModel ToDto(AiCardModelEntity m) =>
        new(m.Id, m.AiCardId, m.StorageKey, m.PublicUrl, m.OriginalFileName, m.ContentType, m.SizeBytes, m.CreatedAt, m.IsActive, m.ThumbnailUrl);
}
