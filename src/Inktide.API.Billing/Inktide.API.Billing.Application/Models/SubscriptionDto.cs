using Inktide.API.Core.Models;

namespace Inktide.API.Billing.Application.Models;

public sealed record SubscriptionDto(
    string UserId,
    PlanType Plan,
    SubStatus Status,
    string? Provider,
    DateTime? CurrentPeriodEnd);

public sealed record CreateCheckoutRequest(
    string UserId,
    string UserEmail,
    string SuccessUrl,
    string CancelUrl,
    PlanType Plan);
