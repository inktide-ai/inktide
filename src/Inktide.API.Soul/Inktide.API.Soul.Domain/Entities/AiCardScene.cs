namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Background scene image uploaded to object storage for an <see cref="AiCard"/> studio preview.
/// </summary>
public sealed class AiCardScene
{

    private AiCardScene() { }


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

    /// <summary>Optional user-assigned filter tag; null keeps legacy hash-based category on the client.</summary>
    public string? Tag { get; private set; }

    /// <summary>Optional display title; when null the client falls back to the file name.</summary>
    public string? DisplayName { get; private set; }

    /// <summary>Optional user-visible description for studio / lists.</summary>
    public string? Description { get; private set; }

    // EF Core navigation
    public AiCard? AiCard { get; private set; }


    public static AiCardScene Create(
        Guid userId,
        Guid aiCardId,
        string storageKey,
        string publicUrl,
        string originalFileName,
        string contentType,
        long sizeBytes,
        DateTime createdAt,
        string? tag = null)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId must not be empty.", nameof(userId));
        if (aiCardId == Guid.Empty) throw new ArgumentException("aiCardId must not be empty.", nameof(aiCardId));
        if (string.IsNullOrWhiteSpace(storageKey)) throw new ArgumentException("storageKey is required.", nameof(storageKey));
        if (string.IsNullOrWhiteSpace(publicUrl)) throw new ArgumentException("publicUrl is required.", nameof(publicUrl));
        if (sizeBytes <= 0) throw new ArgumentOutOfRangeException(nameof(sizeBytes), "sizeBytes must be positive.");

        var scene = new AiCardScene
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
        scene.SetTag(tag);
        return scene;
    }


    /// <summary>Clears to null when <paramref name="value"/> is null/whitespace.</summary>
    public void SetTag(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Tag = null;
            return;
        }

        var t = value.Trim();
        if (t.Length > 128)
            throw new ArgumentOutOfRangeException(nameof(value), "tag must be at most 128 characters.");

        Tag = t;
    }


    /// <summary>Clears to null when <paramref name="value"/> is null/whitespace.</summary>
    public void SetDisplayName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            DisplayName = null;
            return;
        }

        var d = value.Trim();
        if (d.Length > 200)
            throw new ArgumentOutOfRangeException(nameof(value), "display_name must be at most 200 characters.");

        DisplayName = d;
    }


    /// <summary>Clears to null when <paramref name="value"/> is null/whitespace.</summary>
    public void SetDescription(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Description = null;
            return;
        }

        var d = value.Trim();
        if (d.Length > 2000)
            throw new ArgumentOutOfRangeException(nameof(value), "description must be at most 2000 characters.");

        Description = d;
    }

}

