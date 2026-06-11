using Inktide.API.Core.Generators;
using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Uploads / removes a banner image and persists the card's BannerUrl via a targeted atomic update.
/// DIP: depends on IAiCardRepository directly — does not call IAiCardService to avoid chaining
///      application services (which would trigger slug-check, audit log, events unnecessarily).
/// SRP: banner upload + BannerUrl persistence only — file sanitisation delegated to StorageFileHelper.
/// </summary>
public sealed class AiCardBannerService : IAiCardBannerService
{
    private readonly IAiCardRepository _cardRepo;
    private readonly IObjectStorageService _storage;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardBannerService> _logger;

    public AiCardBannerService(
        IAiCardRepository cardRepo,
        IObjectStorageService storage,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardBannerService> logger)
    {
        _cardRepo = cardRepo  ?? throw new ArgumentNullException(nameof(cardRepo));
        _storage  = storage   ?? throw new ArgumentNullException(nameof(storage));
        _s3       = s3        ?? throw new ArgumentNullException(nameof(s3));
        _time     = time      ?? throw new ArgumentNullException(nameof(time));
        _logger   = logger    ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AiCardBannerUpdateResult> UploadBannerAsync(
        Guid userId,
        Guid cardId,
        Stream fileStream,
        string fileName,
        string? contentType,
        CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.StorageUnavailable, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(_s3.DefaultBucket))
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.StorageUnavailable, "S3 default bucket is not configured.");

        var card = await _cardRepo.GetByIdWithRelationsAsync(cardId, ct).ConfigureAwait(false);
        if (card is null || card.UserId != userId)
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.CardNotFound, "AI card not found.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, "banner.bin");
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/banner_{IdGenerator.New():N}_{safeName}";

        await _storage.PutObjectAsync(objectKey, fileStream, contentType, ct).ConfigureAwait(false);

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, objectKey);

        await _cardRepo.SetBannerUrlAsync(cardId, publicUrl, _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);

        card.SetBanner(publicUrl);
        _logger.LogInformation("AI card {CardId} banner set to {Url}", cardId, publicUrl);
        return AiCardBannerUpdateResult.Ok(card);
    }

    public async Task<AiCardBannerUpdateResult> RemoveBannerAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdWithRelationsAsync(cardId, ct).ConfigureAwait(false);
        if (card is null || card.UserId != userId)
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.CardNotFound, "AI card not found.");

        await _cardRepo.SetBannerUrlAsync(cardId, null, _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);

        card.SetBanner(null);
        _logger.LogInformation("AI card {CardId} banner removed", cardId);
        return AiCardBannerUpdateResult.Ok(card);
    }
}
