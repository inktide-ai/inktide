using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Storage;
using Chimera.API.Soul.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Application.Services;

public sealed class AiCardAvatarService : IAiCardAvatarService
{
    #region Fields

    private readonly IAiCardService _cards;
    private readonly IObjectStorageService _storage;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiCardAvatarService> _logger;

    #endregion

    #region Constructors

    public AiCardAvatarService(
        IAiCardService cards,
        IObjectStorageService storage,
        IConfiguration configuration,
        ILogger<AiCardAvatarService> logger)
    {
        _cards = cards ?? throw new ArgumentNullException(nameof(cards));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

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

        var bucket = _configuration["S3Settings:DefaultBucket"];
        if (string.IsNullOrWhiteSpace(bucket))
            return new AiCardAvatarUpdateResult(false, null, "S3 default bucket is not configured.");

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return new AiCardAvatarUpdateResult(false, null, "AI card not found.");

        var safeName = SanitizeFileName(fileName);
        var objectKey = $"users/{userId:N}/cards/{cardId:N}/{Guid.NewGuid():N}_{safeName}";

        await _storage.PutObjectAsync(objectKey, fileStream, contentType, ct).ConfigureAwait(false);

        var serviceUrl = _configuration["S3Settings:ServiceUrl"] ?? string.Empty;
        var publicBase = _configuration["S3Settings:PublicBaseUrl"];
        var publicUrl = ObjectStoragePublicUrl.Build(serviceUrl, publicBase, bucket, objectKey);

        card.AvatarUrl = publicUrl;
        var updated = await _cards.UpdateAsync(userId, card, ct).ConfigureAwait(false);

        _logger.LogInformation("AI card {CardId} avatar set to {Url}", cardId, publicUrl);
        return new AiCardAvatarUpdateResult(true, updated, null);
    }

    #endregion

    #region Private Methods

    private static string SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "avatar.bin";

        var leaf = Path.GetFileName(name);
        return string.IsNullOrEmpty(leaf) ? "avatar.bin" : leaf;
    }

    #endregion
}
