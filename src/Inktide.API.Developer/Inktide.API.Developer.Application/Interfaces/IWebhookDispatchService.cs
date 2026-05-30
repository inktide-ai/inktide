namespace Inktide.API.Developer.Application.Interfaces;

public interface IWebhookDispatchService
{
    Task DispatchAsync(string eventType, object payload, string? connectorSlug, CancellationToken ct);
    Task SendTestPingAsync(Guid applicationId, string ownerId, CancellationToken ct);
}
