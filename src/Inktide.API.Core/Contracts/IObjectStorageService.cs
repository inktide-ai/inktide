namespace Inktide.API.Core.Contracts;

/// <summary>
/// S3-compatible object storage (AWS S3, MinIO, etc.).
/// Cross-context contract: implemented by Profile.Infrastructure, consumed by Soul.Application, Project.REST, and others.
/// </summary>
public interface IObjectStorageService
{
    bool IsEnabled { get; }

    /// <summary>Configured default bucket name.</summary>
    string? DefaultBucket { get; }

    Task PutObjectAsync(string objectKey, Stream content, string? contentType, CancellationToken ct = default);

    Task<Stream> GetObjectAsync(string objectKey, CancellationToken ct = default);

    Task DeleteObjectAsync(string objectKey, CancellationToken ct = default);

    IAsyncEnumerable<ObjectStorageListItem> ListObjectsAsync(string? prefix, CancellationToken ct = default);

    /// <summary>
    /// MinIO / S3-compatible presigned PUT URL for direct browser upload.
    /// Caller must send the same <paramref name="contentType"/> on PUT. Returns null when storage is disabled.
    /// </summary>
    string? GetPreSignedPutUrl(string objectKey, string contentType, TimeSpan expires);

    /// <summary>HEAD object — size and content type. Null if missing or storage disabled.</summary>
    Task<ObjectStorageObjectInfo?> GetObjectInfoAsync(string objectKey, CancellationToken ct = default);
}

public sealed record ObjectStorageListItem(string Key, long Size, DateTime? LastModified);

public sealed record ObjectStorageObjectInfo(long SizeBytes, string? ContentType);
