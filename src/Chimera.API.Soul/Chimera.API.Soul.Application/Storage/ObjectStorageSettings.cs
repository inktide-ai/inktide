namespace Chimera.API.Soul.Application.Storage;

/// <summary>
/// Minimal object storage settings needed by Soul application services.
/// Populated from the same S3Settings config section as Profile.
/// </summary>
public sealed class ObjectStorageSettings
{
    public string ServiceUrl { get; set; } = "http://127.0.0.1:9000";
    public string DefaultBucket { get; set; } = string.Empty;
    public string? PublicBaseUrl { get; set; }
}
