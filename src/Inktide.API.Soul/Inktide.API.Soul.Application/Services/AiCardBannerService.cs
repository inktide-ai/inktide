using Inktide.API.Core.Generators;
using Inktide.API.Core.Transactions;
using System.Text.Json;
using System.Text.Json.Nodes;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Uploads / removes a banner image and patches the card's Appearance JSON blob.
/// DIP: depends on ObjectStorageSettings (typed options), not on IConfiguration.
/// SRP: banner upload + Appearance mutation only — file sanitisation delegated to StorageFileHelper.
/// </summary>
public sealed class AiCardBannerService : IAiCardBannerService
{
    private readonly IAiCardRepository _cardRepo;
    private readonly IObjectStorageService _storage;
    private readonly ITransactionManager _txManager;
    private readonly ObjectStorageSettings _s3;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardBannerService> _logger;

    public AiCardBannerService(
        IAiCardRepository cardRepo,
        IObjectStorageService storage,
        ITransactionManager txManager,
        ObjectStorageSettings s3,
        TimeProvider time,
        ILogger<AiCardBannerService> logger)
    {
        _cardRepo  = cardRepo  ?? throw new ArgumentNullException(nameof(cardRepo));
        _storage   = storage   ?? throw new ArgumentNullException(nameof(storage));
        _txManager = txManager ?? throw new ArgumentNullException(nameof(txManager));
        _s3        = s3        ?? throw new ArgumentNullException(nameof(s3));
        _time      = time      ?? throw new ArgumentNullException(nameof(time));
        _logger    = logger    ?? throw new ArgumentNullException(nameof(logger));
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

        var card = await _cardRepo.GetByIdForUserAsync(cardId, userId, ct).ConfigureAwait(false);
        if (card is null)
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.CardNotFound, "AI card not found.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, "banner.bin");
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/banner_{IdGenerator.New():N}_{safeName}";

        await _storage.PutObjectAsync(objectKey, fileStream, contentType, ct).ConfigureAwait(false);

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, objectKey);

        SetBannerImageUrl(card, publicUrl);
        await _cardRepo.UpdateAppearanceAsync(cardId, card.Appearance, _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);

        _logger.LogInformation("AI card {CardId} banner set to {Url}", cardId, publicUrl);
        return AiCardBannerUpdateResult.Ok(card);
    }

    public async Task<AiCardBannerUpdateResult> RemoveBannerAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdForUserAsync(cardId, userId, ct).ConfigureAwait(false);
        if (card is null)
            return AiCardBannerUpdateResult.Fail(AiCardBannerError.CardNotFound, "AI card not found.");

        SetBannerImageUrl(card, null);
        await _cardRepo.UpdateAppearanceAsync(cardId, card.Appearance, _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);

        _logger.LogInformation("AI card {CardId} banner removed", cardId);
        return AiCardBannerUpdateResult.Ok(card);
    }

    private static void SetBannerImageUrl(AiCard card, string? url)
    {
        var node = JsonNode.Parse(card.Appearance ?? "{}") as JsonObject ?? new JsonObject();
        if (url is null)
            node.Remove("banner_image_url");
        else
            node["banner_image_url"] = url;
        card.Appearance = node.ToJsonString();
    }
}
