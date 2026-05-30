namespace Inktide.API.Developer.Domain.Entities;

public sealed class WebhookDelivery
{
    private WebhookDelivery() { }

    public Guid Id { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string EventType { get; private set; } = string.Empty;
    public string PayloadJson { get; private set; } = string.Empty;
    public int? StatusCode { get; private set; }
    public string? ResponseBody { get; private set; }
    public int Attempt { get; private set; } = 1;
    public DateTime? DeliveredAt { get; private set; }
    public DateTime? NextRetryAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public DeveloperApplication? Application { get; private set; }

    public static WebhookDelivery Create(Guid applicationId, string eventType, string payloadJson) => new()
    {
        Id            = Guid.NewGuid(),
        ApplicationId = applicationId,
        EventType     = eventType,
        PayloadJson   = payloadJson,
        Attempt       = 1,
        CreatedAt     = DateTime.UtcNow,
    };

    public void RecordSuccess(int statusCode, string? responseBody)
    {
        StatusCode   = statusCode;
        ResponseBody = responseBody;
        DeliveredAt  = DateTime.UtcNow;
        NextRetryAt  = null;
    }

    public void RecordFailure(int? statusCode, string? responseBody, DateTime nextRetryAt)
    {
        StatusCode   = statusCode;
        ResponseBody = responseBody;
        NextRetryAt  = nextRetryAt;
        Attempt++;
    }
}
