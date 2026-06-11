namespace Inktide.API.Core.Storage;

/// <summary>
/// Minimal object storage settings for S3/MinIO-backed upload services.
/// </summary>
public sealed class ObjectStorageSettings
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string DefaultBucket { get; set; } = string.Empty;
    public string? PublicBaseUrl { get; set; }
}
