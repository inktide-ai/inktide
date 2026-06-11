namespace Inktide.API.Developer.Application.Messages;

public record WebhookDeliveryRequested(
    Guid DeliveryId,
    Guid ApplicationId,
    string EventType,
    string PayloadJson,
    string WebhookUrl,
    string WebhookSecretHash);
