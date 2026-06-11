namespace Inktide.API.Profile.Infrastructure.Settings;

/// <summary>
/// S3-compatible API (MinIO: set <see cref="ServiceUrl"/> to API port, e.g. <c>http://127.0.0.1:9000</c>, <see cref="ForcePathStyle"/> <c>true</c>).
/// </summary>
public sealed class S3Settings
{

    private bool _enabled;
    private string _serviceUrl = string.Empty;
    private string _accessKey = string.Empty;
    private string _secretKey = string.Empty;
    private string _defaultBucket = string.Empty;
    private bool _forcePathStyle = true;
    private string _region = "us-east-1";
    private string _publicBaseUrl = string.Empty;


    /// <summary>
    /// Optional public origin for object URLs shown in browsers (e.g. reverse proxy or MinIO API URL).
    /// If empty, <see cref="ServiceUrl"/> is used with path-style <c>…/bucket/key</c>.
    /// </summary>
    public string PublicBaseUrl
    {
        get => _publicBaseUrl;
        set => _publicBaseUrl = value;
    }

    public bool Enabled
    {
        get => _enabled;
        set => _enabled = value;
    }

    /// <summary>Endpoint base URL (MinIO API, not console). Example: <c>http://127.0.0.1:9000</c>.</summary>
    public string ServiceUrl
    {
        get => _serviceUrl;
        set => _serviceUrl = value;
    }

    public string AccessKey
    {
        get => _accessKey;
        set => _accessKey = value;
    }

    public string SecretKey
    {
        get => _secretKey;
        set => _secretKey = value;
    }

    /// <summary>Bucket for application uploads (create it in MinIO console or AWS).</summary>
    public string DefaultBucket
    {
        get => _defaultBucket;
        set => _defaultBucket = value;
    }

    /// <summary>Required for MinIO; path-style <c>host/bucket/key</c>.</summary>
    public bool ForcePathStyle
    {
        get => _forcePathStyle;
        set => _forcePathStyle = value;
    }

    /// <summary>Signing region (MinIO often uses <c>us-east-1</c>).</summary>
    public string Region
    {
        get => _region;
        set => _region = value;
    }

}
