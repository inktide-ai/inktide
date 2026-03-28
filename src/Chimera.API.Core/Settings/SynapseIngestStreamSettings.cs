namespace Chimera.API.Core.Settings;

/// <summary>
/// Connector → Synapse ingest transport over Redis Streams (see SYNAPSE_IDEAL_ARCHITECTURE).
/// </summary>
public sealed class SynapseIngestStreamSettings
{
    #region Fields

    private string _streamName = "synapse.ingest";
    private string _consumerGroup = "pipeline-workers";
    private string _consumerNamePrefix = "pipeline";
    private string _payloadFieldName = "payload";
    private long _approximateMaxLength = 50_000;
    private int _readBlockMilliseconds = 2000;
    private int _readCount = 16;
    private long _autoClaimMinIdleMs = 30_000;
    private int _autoClaimBatchSize = 50;
    private int _autoClaimLoopDelaySeconds = 30;

    #endregion

    #region Properties

    /// <summary>Redis stream key (XADD target).</summary>
    public string StreamName
    {
        get => _streamName;
        set => _streamName = value;
    }

    /// <summary>Consumer group for Synapse pipeline workers (XREADGROUP).</summary>
    public string ConsumerGroup
    {
        get => _consumerGroup;
        set => _consumerGroup = value;
    }

    /// <summary>Prefix for consumer name; full name is <c>{prefix}-{instanceId}</c>.</summary>
    public string ConsumerNamePrefix
    {
        get => _consumerNamePrefix;
        set => _consumerNamePrefix = value;
    }

    /// <summary>Stream entry field name holding JSON chat message payload (camelCase).</summary>
    public string PayloadFieldName
    {
        get => _payloadFieldName;
        set => _payloadFieldName = value;
    }

    /// <summary>Approximate MAXLEN for retention (~N).</summary>
    public long ApproximateMaxLength
    {
        get => _approximateMaxLength;
        set => _approximateMaxLength = value;
    }

    /// <summary>When the read returns no messages, delay before polling again (StackExchange.Redis 2.8 has no BLOCK on XREADGROUP).</summary>
    public int ReadBlockMilliseconds
    {
        get => _readBlockMilliseconds;
        set => _readBlockMilliseconds = value;
    }

    /// <summary>Maximum entries per XREADGROUP batch.</summary>
    public int ReadCount
    {
        get => _readCount;
        set => _readCount = value;
    }

    /// <summary>Minimum idle time in ms for XAUTOCLAIM.</summary>
    public long AutoClaimMinIdleMs
    {
        get => _autoClaimMinIdleMs;
        set => _autoClaimMinIdleMs = value;
    }

    /// <summary>Maximum entries per XAUTOCLAIM batch.</summary>
    public int AutoClaimBatchSize
    {
        get => _autoClaimBatchSize;
        set => _autoClaimBatchSize = value;
    }

    /// <summary>Delay between XAUTOCLAIM background iterations.</summary>
    public int AutoClaimLoopDelaySeconds
    {
        get => _autoClaimLoopDelaySeconds;
        set => _autoClaimLoopDelaySeconds = value;
    }

    #endregion

    #region Public Methods

    /// <summary>Resolves a stable-ish instance id for consumer naming (host/pod or short GUID).</summary>
    public static string ResolveConsumerInstanceId()
    {
        return Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
            ?? Environment.GetEnvironmentVariable("HOSTNAME")
            ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
            ?? Guid.NewGuid().ToString("N")[..8];
    }

    /// <summary>Builds the Redis consumer name: <c>{ConsumerNamePrefix}-{instanceId}</c>.</summary>
    public string FormatConsumerName(string instanceId)
    {
        return $"{ConsumerNamePrefix}-{instanceId}";
    }

    #endregion
}
