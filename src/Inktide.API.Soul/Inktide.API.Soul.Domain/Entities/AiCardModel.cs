using Inktide.API.Core.Generators;
namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// 3D/2D model asset uploaded to object storage (e.g. VRM, GLB) for an <see cref="AiCard"/>.
/// </summary>
public sealed class AiCardModel
{

    private AiCardModel() { }


    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid AiCardId { get; private set; }

    /// <summary>S3/MinIO object key (path inside bucket).</summary>
    public string StorageKey { get; private set; } = string.Empty;

    /// <summary>Public or API-reachable URL for clients (path-style MinIO URL).</summary>
    public string PublicUrl { get; private set; } = string.Empty;

    public string OriginalFileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }

    // EF Core navigation
    public AiCard? AiCard { get; private set; }

    public void Activate()   => IsActive = true;
    public void Deactivate() => IsActive = false;

    public static AiCardModel Create(
        Guid userId,
        Guid aiCardId,
        string storageKey,
        string publicUrl,
        string originalFileName,
        string contentType,
        long sizeBytes,
        DateTime createdAt,
        bool isActive = true)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId must not be empty.", nameof(userId));
        if (aiCardId == Guid.Empty) throw new ArgumentException("aiCardId must not be empty.", nameof(aiCardId));
        if (string.IsNullOrWhiteSpace(storageKey)) throw new ArgumentException("storageKey is required.", nameof(storageKey));
        if (string.IsNullOrWhiteSpace(publicUrl)) throw new ArgumentException("publicUrl is required.", nameof(publicUrl));
        if (sizeBytes <= 0) throw new ArgumentOutOfRangeException(nameof(sizeBytes), "sizeBytes must be positive.");

        return new AiCardModel
        {
            Id = IdGenerator.New(),
            UserId = userId,
            AiCardId = aiCardId,
            StorageKey = storageKey,
            PublicUrl = publicUrl,
            OriginalFileName = string.IsNullOrWhiteSpace(originalFileName) ? "model.bin" : originalFileName,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim(),
            SizeBytes = sizeBytes,
            CreatedAt = createdAt,
            IsActive = isActive,
        };
    }

}
