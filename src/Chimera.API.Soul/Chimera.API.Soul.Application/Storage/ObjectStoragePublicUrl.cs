namespace Chimera.API.Soul.Application.Storage;

/// <summary>Path-style public URL for MinIO / S3 (same rules as Profile storage).</summary>
public static class ObjectStoragePublicUrl
{
    public static string Build(string serviceUrl, string? publicBaseUrl, string bucket, string objectKey)
    {
        var baseUrl = string.IsNullOrWhiteSpace(publicBaseUrl)
            ? serviceUrl.TrimEnd('/')
            : publicBaseUrl.TrimEnd('/');

        var b = bucket.Trim('/');
        var key = objectKey.TrimStart('/');
        return $"{baseUrl}/{b}/{key}";
    }
}
