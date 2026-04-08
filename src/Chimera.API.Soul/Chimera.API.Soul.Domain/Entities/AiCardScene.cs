namespace Chimera.API.Soul.Domain.Entities;

/// <summary>
/// Background scene image uploaded to object storage for an <see cref="AiCard"/> studio preview.
/// </summary>
public sealed class AiCardScene
{
    #region Constructors

    private AiCardScene() { }

    #endregion

    #region Properties

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid AiCardId { get; private set; }

    /// <summary>S3/MinIO object key (path inside bucket).</summary>
    public string StorageKey { get; private set; } = string.Empty;

    /// <summary>Public or API-reachable URL for clients.</summary>
    public string PublicUrl { get; private set; } = string.Empty;

    public string OriginalFileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // EF Core navigation
    public AiCard? AiCard { get; private set; }

    #endregion

    #region Factory

    public static AiCardScene Create(
        Guid userId,
        Guid aiCardId,
        string storageKey,
        string publicUrl,
        string originalFileName,
        string contentType,
        long sizeBytes,
        DateTime createdAt)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId must not be empty.", nameof(userId));
        if (aiCardId == Guid.Empty) throw new ArgumentException("aiCardId must not be empty.", nameof(aiCardId));
        if (string.IsNullOrWhiteSpace(storageKey)) throw new ArgumentException("storageKey is required.", nameof(storageKey));
        if (string.IsNullOrWhiteSpace(publicUrl)) throw new ArgumentException("publicUrl is required.", nameof(publicUrl));
        if (sizeBytes <= 0) throw new ArgumentOutOfRangeException(nameof(sizeBytes), "sizeBytes must be positive.");

        return new AiCardScene
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AiCardId = aiCardId,
            StorageKey = storageKey,
            PublicUrl = publicUrl,
            OriginalFileName = string.IsNullOrWhiteSpace(originalFileName) ? "background.jpg" : originalFileName,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "image/jpeg" : contentType.Trim(),
            SizeBytes = sizeBytes,
            CreatedAt = createdAt,
        };
    }

    #endregion
}
