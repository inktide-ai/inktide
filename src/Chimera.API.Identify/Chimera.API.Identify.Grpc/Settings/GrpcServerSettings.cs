namespace Chimera.API.Identify.Grpc.Settings;

/// <summary>
/// Global gRPC server configuration for all gRPC endpoints.
/// </summary>
public sealed class GrpcServerSettings
{
    private string _listenAddress = "127.0.0.1";
    private ushort _listenPort = 8081;
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
    /// gRPC listen port (default: 8081).
    /// </summary>
    public ushort ListenPort
    {
        get => _listenPort;
        set => _listenPort = value;
    }

    /// <summary>
    /// Path to TLS certificate (optional).
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
