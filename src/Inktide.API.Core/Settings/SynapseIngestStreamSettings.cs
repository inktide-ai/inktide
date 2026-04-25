namespace Inktide.API.Core.Settings;

/// <summary>
/// Connector → Synapse ingest transport over Redis Streams (see SYNAPSE_IDEAL_ARCHITECTURE).
/// </summary>
public sealed class SynapseIngestStreamSettings
{

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


    public string StreamName
    {
        get => _streamName;
        set => _streamName = value;
    }

    public string ConsumerGroup
    {
        get => _consumerGroup;
        set => _consumerGroup = value;
    }

    public string ConsumerNamePrefix
    {
        get => _consumerNamePrefix;
        set => _consumerNamePrefix = value;
    }

    public string PayloadFieldName
    {
        get => _payloadFieldName;
        set => _payloadFieldName = value;
    }

    public long ApproximateMaxLength
    {
        get => _approximateMaxLength;
        set => _approximateMaxLength = value;
    }

    // StackExchange.Redis 2.8 doesn't support BLOCK on XREADGROUP, so this is a poll delay.
    public int ReadBlockMilliseconds
    {
        get => _readBlockMilliseconds;
        set => _readBlockMilliseconds = value;
    }

    public int ReadCount
    {
        get => _readCount;
        set => _readCount = value;
    }

    public long AutoClaimMinIdleMs
    {
        get => _autoClaimMinIdleMs;
        set => _autoClaimMinIdleMs = value;
    }

    public int AutoClaimBatchSize
    {
        get => _autoClaimBatchSize;
        set => _autoClaimBatchSize = value;
    }

    public int AutoClaimLoopDelaySeconds
    {
        get => _autoClaimLoopDelaySeconds;
        set => _autoClaimLoopDelaySeconds = value;
    }


    public static string ResolveConsumerInstanceId()
    {
        return Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
            ?? Environment.GetEnvironmentVariable("HOSTNAME")
            ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
            ?? Guid.NewGuid().ToString("N")[..8];
    }

    public string FormatConsumerName(string instanceId)
    {
        return $"{ConsumerNamePrefix}-{instanceId}";
    }

}
