using Chimera.API.Profile.Infrastructure.Settings;

namespace Chimera.API.Profile.Infrastructure.Storage;

public static class S3ObjectPublicUrl
{
    /// <summary>Path-style URL: <c>{base}/{bucket}/{key}</c> (MinIO / S3 path-style).</summary>
    public static string Build(S3Settings settings, string objectKey)
    {
        var baseUrl = string.IsNullOrWhiteSpace(settings.PublicBaseUrl)
            ? settings.ServiceUrl.TrimEnd('/')
            : settings.PublicBaseUrl.TrimEnd('/');

        var bucket = settings.DefaultBucket.Trim('/');
        var key = objectKey.TrimStart('/');
        return $"{baseUrl}/{bucket}/{key}";
    }
}
