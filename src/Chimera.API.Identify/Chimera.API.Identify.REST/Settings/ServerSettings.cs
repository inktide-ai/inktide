using System.Net;

namespace Chimera.API.Identify.REST.Settings;

/// <summary>
/// REST/HTTP server configuration. Also applies Kestrel limits for high load.
/// </summary>
public class ServerSettings
{
    private string _listenAddress = "127.0.0.1";
    private ushort _listenPort = 8080;
    private long _maxConcurrentConnections;
    private long _maxConcurrentUpgradedConnections = 100;
    private int _keepAliveTimeoutSeconds;
    private int _requestHeadersTimeoutSeconds;
    private long? _maxRequestBodySizeBytes = 10 * 1024 * 1024;

    public string ListenAddress
    {
        get => string.IsNullOrEmpty(_listenAddress) || _listenAddress.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            ? IPAddress.Loopback.ToString()
            : _listenAddress;
        set => _listenAddress = value ?? "127.0.0.1";
    }

    public ushort ListenPort
    {
        get => _listenPort;
        set => _listenPort = value;
    }

    /// <summary>Max concurrent connections (0 = unlimited). For 10k+ RPS use 0 or high value.</summary>
    public long MaxConcurrentConnections
    {
        get => _maxConcurrentConnections;
        set => _maxConcurrentConnections = value;
    }

    /// <summary>Max concurrent upgraded (HTTP/2, WebSocket) connections. Default 100.</summary>
    public long MaxConcurrentUpgradedConnections
    {
        get => _maxConcurrentUpgradedConnections;
        set => _maxConcurrentUpgradedConnections = value;
    }

    /// <summary>Keep-alive timeout in seconds. 0 = default. 130 aligns with typical load balancer.</summary>
    public int KeepAliveTimeoutSeconds
    {
        get => _keepAliveTimeoutSeconds;
        set => _keepAliveTimeoutSeconds = value;
    }

    /// <summary>Request headers timeout in seconds. 0 = default.</summary>
    public int RequestHeadersTimeoutSeconds
    {
        get => _requestHeadersTimeoutSeconds;
        set => _requestHeadersTimeoutSeconds = value;
    }

    /// <summary>Max request body size in bytes. Default 10 MB. Set null for unlimited.</summary>
    public long? MaxRequestBodySizeBytes
    {
        get => _maxRequestBodySizeBytes;
        set => _maxRequestBodySizeBytes = value;
    }
}
