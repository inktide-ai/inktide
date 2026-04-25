namespace Inktide.API.Core.Settings;

/// <summary>
/// Redis configuration section (RedisSettings). Used by host and infrastructure for a single connection string format.
/// </summary>
public sealed class RedisSettings
{
    private string _baseAddress = "127.0.0.1";
    private int _basePort = 6379;
    private int _syncTimeout = 10000;
    private int _connectTimeout = 5000;
    private int _asyncTimeout = 10000;

    /// <summary>Redis host (e.g. localhost or 127.0.0.1).</summary>
    public string BaseAddress
    {
        get => _baseAddress;
        set => _baseAddress = value;
    }

    /// <summary>Redis port.</summary>
    public int BasePort
    {
        get => _basePort;
        set => _basePort = value;
    }

    /// <summary>Sync timeout in milliseconds.</summary>
    public int SyncTimeout
    {
        get => _syncTimeout;
        set => _syncTimeout = value;
    }

    /// <summary>Connect timeout in milliseconds.</summary>
    public int ConnectTimeout
    {
        get => _connectTimeout;
        set => _connectTimeout = value;
    }

    /// <summary>Async timeout in milliseconds.</summary>
    public int AsyncTimeout
    {
        get => _asyncTimeout;
        set => _asyncTimeout = value;
    }

    /// <summary>Builds StackExchange.Redis connection string (abortConnect=false and timeouts).</summary>
    public string ToConnectionString() =>
        $"{BaseAddress}:{BasePort},abortConnect=false,syncTimeout={SyncTimeout},connectTimeout={ConnectTimeout},asyncTimeout={AsyncTimeout}";
}
