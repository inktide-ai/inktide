using Inktide.API.Core.Generators;
using Inktide.API.Core.Transactions;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Uploads an avatar image to object storage and updates the card's AvatarUrl.
/// DIP: depends on ObjectStorageSettings (typed options), not on IConfiguration.
///      IConfiguration is a framework concern; ObjectStorageSettings is a domain value object.
/// SRP: avatar upload only — file sanitisation delegated to StorageFileHelper.
/// </summary>
public sealed class AiCardAvatarService : IAiCardAvatarService
{
    private readonly IAiCardRepository _cardRepo;
    private readonly IObjectStorageService _storage;
    private readonly ITransactionManager _txManager;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardAvatarService> _logger;

    public AiCardAvatarService(
        IAiCardRepository cardRepo,
        IObjectStorageService storage,
        ITransactionManager txManager,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardAvatarService> logger)
    {
        _cardRepo  = cardRepo  ?? throw new ArgumentNullException(nameof(cardRepo));
        _storage   = storage   ?? throw new ArgumentNullException(nameof(storage));
        _txManager = txManager ?? throw new ArgumentNullException(nameof(txManager));
        _s3        = s3        ?? throw new ArgumentNullException(nameof(s3));
        _time      = time      ?? throw new ArgumentNullException(nameof(time));
        _logger    = logger    ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AiCardAvatarUpdateResult> UploadAvatarAsync(
        Guid userId,
        Guid cardId,
        Stream fileStream,
        string fileName,
        string? contentType,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return AiCardAvatarUpdateResult.Fail(AiCardAvatarError.StorageUnavailable, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(_s3.DefaultBucket))
            return AiCardAvatarUpdateResult.Fail(AiCardAvatarError.StorageUnavailable, "S3 default bucket is not configured.");

        var card = await _cardRepo.GetByIdForUserAsync(cardId, userId, ct).ConfigureAwait(false);
        if (card is null)
            return AiCardAvatarUpdateResult.Fail(AiCardAvatarError.CardNotFound, "AI card not found.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, "avatar.bin");
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/{IdGenerator.New():N}_{safeName}";

        await _storage.PutObjectAsync(objectKey, fileStream, contentType, ct).ConfigureAwait(false);

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, objectKey);

        await _cardRepo.UpdateAvatarUrlAsync(cardId, publicUrl, _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);

        card.AvatarUrl = publicUrl;
        _logger.LogInformation("AI card {CardId} avatar set to {Url}", cardId, publicUrl);
        return AiCardAvatarUpdateResult.Ok(card);
    }
}
