namespace Inktide.API.Soul.Grpc.Settings;

/// <summary>
/// gRPC server configuration for the Soul module.
/// Bound from the <c>SoulGrpcServerSettings</c> configuration section.
/// Default port: 8084 (Identify.Grpc uses 8081, so each module gets its own port).
/// </summary>
public sealed class SoulGrpcServerSettings
{

    private string _listenAddress = "127.0.0.1";
    private ushort _listenPort = 8084;
    private string? _certPath;
    private string? _certPassword;


    /// <summary>
    /// Listen address (default: 127.0.0.1).
    /// </summary>
    public string ListenAddress
    {
        get => _listenAddress;
        set => _listenAddress = value ?? "127.0.0.1";
    }

    /// <summary>
    /// gRPC listen port (default: 8083). Set to 0 to disable.
    /// </summary>
    public ushort ListenPort
    {
        get => _listenPort;
        set => _listenPort = value;
    }

    /// <summary>
    /// Path to TLS certificate file (optional — omit for plaintext HTTP/2).
    /// </summary>
    public string? CertPath
    {
        get => _certPath;
        set => _certPath = value;
    }

    /// <summary>
    /// TLS certificate password (optional).
    /// </summary>
    public string? CertPassword
    {
        get => _certPassword;
        set => _certPassword = value;
    }

}
