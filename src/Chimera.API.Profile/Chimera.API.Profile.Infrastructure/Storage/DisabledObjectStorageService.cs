using Chimera.API.Profile.Application.Interfaces;

namespace Chimera.API.Profile.Infrastructure.Storage;

public sealed class DisabledObjectStorageService : IObjectStorageService
{

    public bool IsEnabled => false;

    public string? DefaultBucket => null;


    public Task DeleteObjectAsync(string objectKey, CancellationToken ct = default)
    {
        throw new InvalidOperationException("Object storage (S3) is disabled. Enable S3Settings:Enabled and configure MinIO/AWS.");
    }

    public Task<Stream> GetObjectAsync(string objectKey, CancellationToken ct = default)
    {
        throw new InvalidOperationException("Object storage (S3) is disabled. Enable S3Settings:Enabled and configure MinIO/AWS.");
    }

    public Task<IReadOnlyList<ObjectStorageListItem>> ListObjectsAsync(string? prefix, CancellationToken ct = default)
    {
        throw new InvalidOperationException("Object storage (S3) is disabled. Enable S3Settings:Enabled and configure MinIO/AWS.");
    }

    public Task PutObjectAsync(string objectKey, Stream content, string? contentType, CancellationToken ct = default)
    {
        throw new InvalidOperationException("Object storage (S3) is disabled. Enable S3Settings:Enabled and configure MinIO/AWS.");
    }

    public string? GetPreSignedPutUrl(string objectKey, string contentType, TimeSpan expires)
    {
        return null;
    }

    public Task<ObjectStorageObjectInfo?> GetObjectInfoAsync(string objectKey, CancellationToken ct = default)
    {
        return Task.FromResult<ObjectStorageObjectInfo?>(null);
    }

}
