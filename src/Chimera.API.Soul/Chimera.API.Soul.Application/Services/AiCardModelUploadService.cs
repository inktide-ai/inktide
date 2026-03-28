using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Storage;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Application.Services;

public sealed class AiCardModelUploadService : IAiCardModelUploadService
{
    #region Fields

    private const long MaxModelBytes = 209_715_200;
    private const int MaxModelsPerCard = 20;

    private static readonly HashSet<string> AllowedExtensions =
    [
        ".vrm", ".glb", ".gltf", ".zip", ".json"
    ];

    private static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);

    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly IAiCardModelRepository _models;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardModelUploadService> _logger;

    #endregion

    #region Constructors

    public AiCardModelUploadService(
        IAiCardService cards,
        IObjectStorageService storage,
        IAiCardModelRepository models,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardModelUploadService> logger)
    {
        _cards = cards ?? throw new ArgumentNullException(nameof(cards));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _models = models ?? throw new ArgumentNullException(nameof(models));
        _s3 = s3 ?? throw new ArgumentNullException(nameof(s3));
        _time = time ?? throw new ArgumentNullException(nameof(time));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task<BeginModelUploadResult> BeginUploadAsync(
        Guid userId,
        Guid cardId,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return BeginModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Object storage is not configured.");

        var validationError = ValidateFileNameAndSize(fileName, sizeBytes);
        if (validationError is not null)
            return BeginModelUploadResult.Fail(ModelUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return BeginModelUploadResult.Fail(ModelUploadError.CardNotFound, "AI card not found.");

        var existingCount = await _models.CountByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        if (existingCount >= MaxModelsPerCard)
            return BeginModelUploadResult.Fail(ModelUploadError.Validation,
                $"Model limit reached ({MaxModelsPerCard} per card).");

        var safeName = SanitizeFileName(fileName);
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/models/{Guid.NewGuid():N}_{safeName}";
        var ctNormalized = NormalizeContentType(contentType);

        var uploadUrl = _storage.GetPreSignedPutUrl(objectKey, ctNormalized, PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return BeginModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Could not create upload URL.");

        var expiresAt = _time.GetUtcNow().Add(PresignTtl);
        _logger.LogInformation("Presigned model upload key={Key} card={CardId}", objectKey, cardId);

        return BeginModelUploadResult.Ok(uploadUrl, objectKey, expiresAt, ctNormalized);
    }

    public async Task<CompleteModelUploadResult> CompleteUploadAsync(
        Guid userId,
        Guid cardId,
        string storageKey,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return CompleteModelUploadResult.Fail(ModelUploadError.StorageDisabled, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(storageKey))
            return CompleteModelUploadResult.Fail(ModelUploadError.Validation, "storage_key is required.");

        var validationError = ValidateFileNameAndSize(fileName, sizeBytes);
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

        _logger.LogInformation("CompleteUpload: checking object in storage key={Key}", storageKey);
        var info = await _storage.GetObjectInfoAsync(storageKey, ct).ConfigureAwait(false);
        if (info is null)
        {
            _logger.LogWarning("CompleteUpload: object not found in storage key={Key}", storageKey);
            return CompleteModelUploadResult.Fail(ModelUploadError.ObjectNotFoundInStorage,
                "Object not found in storage. Upload may have failed.");
        }

        _logger.LogInformation("CompleteUpload: object found size={StoredSize} reported={ReportedSize}", info.SizeBytes, sizeBytes);
        if (info.SizeBytes != sizeBytes)
        {
            _logger.LogWarning("CompleteUpload: size mismatch stored={StoredSize} reported={ReportedSize}", info.SizeBytes, sizeBytes);
            return CompleteModelUploadResult.Fail(ModelUploadError.SizeMismatch,
                "Reported size does not match stored object.");
        }

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, storageKey);
        var entity = AiCardModel.Create(
            userId,
            cardId,
            storageKey,
            publicUrl,
            SanitizeFileName(fileName),
            NormalizeContentType(contentType),
            sizeBytes,
            _time.GetUtcNow().UtcDateTime);

        await _models.AddAsync(entity, ct).ConfigureAwait(false);
        _logger.LogInformation("Saved ai_card_models id={Id} key={Key}", entity.Id, storageKey);

        // Delete previous models for this card — one active model per card.
        var previous = await _models.ListOthersByCardAsync(userId, cardId, entity.Id, ct).ConfigureAwait(false);
        foreach (var old in previous)
        {
            if (_storage.IsEnabled)
            {
                try { await _storage.DeleteObjectAsync(old.StorageKey, ct).ConfigureAwait(false); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete old model object key={Key}", old.StorageKey); }
            }
            await _models.DeleteAsync(old, ct).ConfigureAwait(false);
            _logger.LogInformation("Deleted old ai_card_model id={Id} key={Key}", old.Id, old.StorageKey);
        }

        return CompleteModelUploadResult.Ok(ToDto(entity));
    }

    public async Task<IReadOnlyList<AiCardModelDto>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return null;

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
            try
            {
                await _storage.DeleteObjectAsync(model.StorageKey, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete object from storage key={Key}, proceeding with DB delete.", model.StorageKey);
            }
        }

        await _models.DeleteAsync(model, ct).ConfigureAwait(false);
        _logger.LogInformation("Deleted ai_card_models id={Id} key={Key}", model.Id, model.StorageKey);

        return DeleteModelResult.Ok();
    }

    #endregion

    #region Private Methods

    private static AiCardModelDto ToDto(AiCardModel m)
        => new(m.Id, m.AiCardId, m.StorageKey, m.PublicUrl, m.OriginalFileName, m.ContentType, m.SizeBytes, m.CreatedAt);

    private static string? ValidateFileNameAndSize(string fileName, long sizeBytes)
    {
        if (sizeBytes <= 0)
            return "size_bytes must be positive.";

        if (sizeBytes > MaxModelBytes)
            return $"File too large (max {MaxModelBytes / 1_048_576} MB).";

        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext.ToLowerInvariant()))
            return $"Allowed extensions: {string.Join(", ", AllowedExtensions)}.";

        return null;
    }

    private static string SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "model.bin";
        var leaf = Path.GetFileName(name);
        return string.IsNullOrEmpty(leaf) ? "model.bin" : leaf;
    }

    private static string NormalizeContentType(string? contentType)
        => string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();

    #endregion
}
