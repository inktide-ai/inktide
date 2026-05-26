namespace Inktide.API.Realtime.Infrastructure.Configuration;

public abstract class StreamConsumerSettings
{
    public abstract string StreamName         { get; set; }
    public abstract string ConsumerGroup      { get; set; }
    public abstract string ConsumerNamePrefix { get; set; }
    public string PayloadFieldName            { get; set; } = "payload";
    public int    ReadCount                   { get; set; } = 8;
    public int    ReadBlockMilliseconds       { get; set; } = 2000;
    public long   AutoClaimMinIdleMs          { get; set; } = 30_000;
    public int    AutoClaimBatchSize          { get; set; } = 20;
    public int    AutoClaimLoopDelaySeconds   { get; set; } = 30;
}
