using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Entities;
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
    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly ObjectStorageSettings _s3;
    private readonly ILogger<AiCardAvatarService> _logger;

    public AiCardAvatarService(
        IAiCardService cards,
        IObjectStorageService storage,
        ObjectStorageSettings s3,
        ILogger<AiCardAvatarService> logger)
    {
        _cards   = cards   ?? throw new ArgumentNullException(nameof(cards));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _s3      = s3      ?? throw new ArgumentNullException(nameof(s3));
        _logger  = logger  ?? throw new ArgumentNullException(nameof(logger));
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
            return new AiCardAvatarUpdateResult(false, null, "Object storage is not configured.");

        if (string.IsNullOrWhiteSpace(_s3.DefaultBucket))
            return new AiCardAvatarUpdateResult(false, null, "S3 default bucket is not configured.");

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return new AiCardAvatarUpdateResult(false, null, "AI card not found.");

        var safeName  = StorageFileHelper.SanitizeFileName(fileName, "avatar.bin");
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/{Guid.NewGuid():N}_{safeName}";

        await _storage.PutObjectAsync(objectKey, fileStream, contentType, ct).ConfigureAwait(false);

        var publicUrl = ObjectStoragePublicUrl.Build(_s3.ServiceUrl, _s3.PublicBaseUrl, _s3.DefaultBucket, objectKey);

        card.AvatarUrl = publicUrl;
        var updated = await _cards.UpdateAsync(userId, card, ct).ConfigureAwait(false);

        _logger.LogInformation("AI card {CardId} avatar set to {Url}", cardId, publicUrl);
        return new AiCardAvatarUpdateResult(true, updated, null);
    }
}
