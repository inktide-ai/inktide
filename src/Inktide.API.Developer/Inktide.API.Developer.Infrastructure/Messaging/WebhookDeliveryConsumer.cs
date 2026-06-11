using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using Inktide.API.Developer.Application.Messages;
using Inktide.API.Developer.Domain.Repositories;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Developer.Infrastructure.Messaging;

public sealed class WebhookDeliveryConsumer(
    IWebhookDeliveryRepository deliveryRepo,
    IHttpClientFactory httpFactory,
    ILogger<WebhookDeliveryConsumer> logger) : IConsumer<WebhookDeliveryRequested>
{
    public async Task Consume(ConsumeContext<WebhookDeliveryRequested> context)
    {
        var msg = context.Message;
        var ct  = context.CancellationToken;

        var delivery = await deliveryRepo.FindByIdAsync(msg.DeliveryId, ct)
            ?? throw new InvalidOperationException($"WebhookDelivery {msg.DeliveryId} not found.");

        var (statusCode, responseBody) = await PostWebhookAsync(
            msg.WebhookUrl, msg.PayloadJson, msg.WebhookSecretHash, msg.EventType, ct);

        if (statusCode is >= 200 and < 300)
        {
            delivery.RecordSuccess(statusCode!.Value, responseBody);
            await deliveryRepo.UpdateAsync(delivery, ct);
        }
        else
        {
            delivery.RecordFailure(statusCode, responseBody);
            await deliveryRepo.UpdateAsync(delivery, ct);
            throw new WebhookDeliveryException(
                $"Webhook to {msg.WebhookUrl} returned HTTP {statusCode?.ToString() ?? "null"}.");
        }
    }

    private async Task<(int? StatusCode, string? Body)> PostWebhookAsync(
        string url, string payloadJson, string secretHash, string eventType, CancellationToken ct)
    {
        try
        {
            using var http      = httpFactory.CreateClient("WebhookDelivery");
            var bodyBytes = Encoding.UTF8.GetBytes(payloadJson);

            string signature = string.Empty;
            if (!string.IsNullOrWhiteSpace(secretHash))
            {
                var secretBytes = Convert.FromHexString(secretHash);
                var hmac        = HMACSHA256.HashData(secretBytes, bodyBytes);
                signature       = $"sha256={Convert.ToHexString(hmac).ToLowerInvariant()}";
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            req.Content = new ByteArrayContent(bodyBytes);
            req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            req.Headers.Add("X-Inktide-Event", eventType);
            if (!string.IsNullOrWhiteSpace(signature))
                req.Headers.Add("X-Inktide-Signature", signature);

            var res  = await http.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);
            return ((int)res.StatusCode, body.Length > 500 ? body[..500] : body);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Webhook POST failed to {Url}", url);
            return (null, ex.Message);
        }
    }
}

public sealed class WebhookDeliveryFaultConsumer(
    IWebhookDeliveryRepository deliveryRepo,
    ILogger<WebhookDeliveryFaultConsumer> logger) : IConsumer<Fault<WebhookDeliveryRequested>>
{
    public async Task Consume(ConsumeContext<Fault<WebhookDeliveryRequested>> context)
    {
        var deliveryId = context.Message.Message.DeliveryId;
        var ct         = context.CancellationToken;

        var delivery = await deliveryRepo.FindByIdAsync(deliveryId, ct);
        if (delivery is null)
        {
            logger.LogWarning("WebhookDelivery {DeliveryId} not found when handling fault.", deliveryId);
            return;
        }

        delivery.RecordExhausted();
        await deliveryRepo.UpdateAsync(delivery, ct);

        logger.LogWarning(
            "Webhook delivery {DeliveryId} for app {AppId} exhausted all retries.",
            deliveryId, delivery.ApplicationId);
    }
}

public sealed class WebhookDeliveryException(string message) : Exception(message);
