using System.Text.Json;
using Inktide.API.Marketplace.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Marketplace.Infrastructure.Services;

// Publishes events to the same Redis stream that Developer.WebhookDeliveryWorker consumes.
// No direct project reference to Developer — uses the agreed stream name.
internal sealed class ConnectorEventPublisher(
    IConnectionMultiplexer redis,
    ILogger<ConnectorEventPublisher> logger) : IConnectorEventPublisher
{
    private const string StreamName = "platform.webhook.events";

    public Task PublishInstalledAsync(Guid installationId, Guid soulId, string connectorSlug, CancellationToken ct) =>
        PublishAsync("connector.installed", new
        {
            installation_id = installationId,
            soul_id         = soulId,
            connector_slug  = connectorSlug,
        }, connectorSlug, ct);

    public Task PublishUninstalledAsync(Guid installationId, Guid soulId, string connectorSlug, CancellationToken ct) =>
        PublishAsync("connector.uninstalled", new
        {
            installation_id = installationId,
            soul_id         = soulId,
            connector_slug  = connectorSlug,
        }, connectorSlug, ct);

    private async Task PublishAsync(string eventType, object data, string connectorSlug, CancellationToken ct)
    {
        var payload = JsonSerializer.Serialize(new
        {
            id        = Guid.NewGuid(),
            @event    = eventType,
            timestamp = DateTime.UtcNow,
            data,
        });

        // The application_id field is left blank here — WebhookDeliveryWorker looks up apps by connector_slug
        // when application_id is missing. This avoids direct DB query from Marketplace.
        var db = redis.GetDatabase();
        await db.StreamAddAsync(StreamName,
        [
            new NameValueEntry("application_id",      string.Empty),
            new NameValueEntry("event_type",           eventType),
            new NameValueEntry("payload_json",         payload),
            new NameValueEntry("webhook_url",          string.Empty),
            new NameValueEntry("webhook_secret_hash",  string.Empty),
            new NameValueEntry("connector_slug",       connectorSlug),
        ]);

        logger.LogDebug("Published {EventType} for connector {Slug}", eventType, connectorSlug);
    }
}
