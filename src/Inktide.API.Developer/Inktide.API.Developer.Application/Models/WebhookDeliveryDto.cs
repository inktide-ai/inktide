using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Enums;

namespace Inktide.API.Developer.Application.Models;

public sealed record WebhookDeliveryDto(
    Guid Id,
    string EventType,
    int? StatusCode,
    int Attempt,
    DateTime? DeliveredAt,
    DateTime? NextRetryAt,
    DateTime CreatedAt,
    WebhookDeliveryStatus Status)
{
    public static WebhookDeliveryDto From(WebhookDelivery d) => new(
        d.Id, d.EventType, d.StatusCode, d.Attempt, d.DeliveredAt, d.NextRetryAt, d.CreatedAt, d.Status);
}
