namespace Chimera.API.Profile.Application.Interfaces;

/// <summary>
/// S3-compatible object storage (AWS S3, MinIO, etc.).
/// </summary>
public interface IObjectStorageService
{
    bool IsEnabled { get; }

    /// <summary>Configured default bucket name.</summary>
    string? DefaultBucket { get; }

    Task PutObjectAsync(string objectKey, Stream content, string? contentType, CancellationToken ct = default);

    Task<Stream> GetObjectAsync(string objectKey, CancellationToken ct = default);

    Task DeleteObjectAsync(string objectKey, CancellationToken ct = default);

    Task<IReadOnlyList<ObjectStorageListItem>> ListObjectsAsync(string? prefix, CancellationToken ct = default);
}

public sealed record ObjectStorageListItem(string Key, long Size, DateTime? LastModified);
