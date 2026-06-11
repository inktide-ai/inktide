using System.Text.Json;
using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Application.Messages;
using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Repositories;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Developer.Infrastructure.Services;

internal sealed class WebhookDispatchService : IWebhookDispatchService
{
    private readonly IDeveloperApplicationRepository _appRepo;
    private readonly IWebhookDeliveryRepository _deliveryRepo;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<WebhookDispatchService> _logger;

    public WebhookDispatchService(
        IDeveloperApplicationRepository appRepo,
        IWebhookDeliveryRepository deliveryRepo,
        IPublishEndpoint publishEndpoint,
        ILogger<WebhookDispatchService> logger)
    {
        _appRepo         = appRepo         ?? throw new ArgumentNullException(nameof(appRepo));
        _deliveryRepo    = deliveryRepo    ?? throw new ArgumentNullException(nameof(deliveryRepo));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));
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

        foreach (var app in apps)
        {
            if (string.IsNullOrWhiteSpace(app.WebhookUrl)) continue;

            var delivery = WebhookDelivery.Create(app.Id, eventType, payloadJson);
            await _deliveryRepo.AddAsync(delivery, ct);

            await _publishEndpoint.Publish(new WebhookDeliveryRequested(
                delivery.Id,
                app.Id,
                eventType,
                payloadJson,
                app.WebhookUrl!,
                app.WebhookSecretHash ?? string.Empty), ct);

            _logger.LogDebug("Dispatched {EventType} for app {AppId} delivery {DeliveryId}",
                eventType, app.Id, delivery.Id);
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
