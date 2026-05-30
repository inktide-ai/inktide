namespace Inktide.API.Developer.Infrastructure.Settings;

public sealed class DeveloperSettings
{
    public string StreamName { get; set; } = "platform.webhook.events";
    public string ConsumerGroup { get; set; } = "webhook-workers";
    public int ReadCount { get; set; } = 10;
    public int AutoClaimMinIdleMs { get; set; } = 30_000;
    public int AutoClaimBatchSize { get; set; } = 5;
    public int MaxDeliveryAttempts { get; set; } = 5;
}
