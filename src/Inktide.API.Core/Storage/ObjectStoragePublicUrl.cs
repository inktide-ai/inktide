namespace Inktide.API.Core.Storage;

/// <summary>Path-style public URL for MinIO / S3.</summary>
public static class ObjectStoragePublicUrl
{
    public static string Build(string serviceUrl, string? publicBaseUrl, string bucket, string objectKey)
    {
        var baseUrl = string.IsNullOrWhiteSpace(publicBaseUrl)
            ? serviceUrl.TrimEnd('/')
            : publicBaseUrl.TrimEnd('/');

        var b = bucket.Trim('/');
        // Percent-encode each path segment so filenames with spaces, Cyrillic, or
        // other RFC 3986 reserved characters produce valid, loadable URLs.
        var encodedKey = string.Join("/",
            objectKey.TrimStart('/').Split('/').Select(Uri.EscapeDataString));
        return $"{baseUrl}/{b}/{encodedKey}";
    }
}
