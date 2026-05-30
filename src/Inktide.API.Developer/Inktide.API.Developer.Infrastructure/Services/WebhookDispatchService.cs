using System.Text.Json;
using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Repositories;
using Inktide.API.Developer.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Developer.Infrastructure.Services;

internal sealed class WebhookDispatchService : IWebhookDispatchService
{
    private readonly IDeveloperApplicationRepository _appRepo;
    private readonly IWebhookDeliveryRepository _deliveryRepo;
    private readonly IConnectionMultiplexer _redis;
    private readonly DeveloperSettings _settings;
    private readonly ILogger<WebhookDispatchService> _logger;

    public WebhookDispatchService(
        IDeveloperApplicationRepository appRepo,
        IWebhookDeliveryRepository deliveryRepo,
        IConnectionMultiplexer redis,
        DeveloperSettings settings,
        ILogger<WebhookDispatchService> logger)
    {
        _appRepo      = appRepo      ?? throw new ArgumentNullException(nameof(appRepo));
        _deliveryRepo = deliveryRepo ?? throw new ArgumentNullException(nameof(deliveryRepo));
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _settings     = settings     ?? throw new ArgumentNullException(nameof(settings));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task DispatchAsync(string eventType, object payload, string? connectorSlug, CancellationToken ct)
    {
        var apps = connectorSlug is not null
            ? await _appRepo.GetByConnectorSlugAsync(connectorSlug, ct)
            : [];

        if (apps.Count == 0) return;

        var payloadJson = JsonSerializer.Serialize(new
        {
            id        = Guid.NewGuid(),
            @event    = eventType,
            timestamp = DateTime.UtcNow,
            data      = payload,
        });

        var db = _redis.GetDatabase();
        foreach (var app in apps)
        {
            if (string.IsNullOrWhiteSpace(app.WebhookUrl)) continue;

            await db.StreamAddAsync(_settings.StreamName,
            [
                new NameValueEntry("application_id",      app.Id.ToString()),
                new NameValueEntry("event_type",           eventType),
                new NameValueEntry("payload_json",         payloadJson),
                new NameValueEntry("webhook_url",          app.WebhookUrl),
                new NameValueEntry("webhook_secret_hash",  app.WebhookSecretHash ?? string.Empty),
            ]);

            _logger.LogDebug("Dispatched {EventType} for app {AppId}", eventType, app.Id);
        }
    }

    public async Task SendTestPingAsync(Guid applicationId, string ownerId, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(applicationId, ct);
        if (app is null || app.OwnerUserId != ownerId)
            throw new InvalidOperationException("Application not found.");

        if (string.IsNullOrWhiteSpace(app.WebhookUrl))
            throw new InvalidOperationException("No webhook URL configured.");

        await DispatchAsync("ping", new { message = "Webhook test from Inktide" }, app.ConnectorSlug, ct);
    }
}
