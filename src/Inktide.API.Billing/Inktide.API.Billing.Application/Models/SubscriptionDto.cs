using Inktide.API.Core.Models;

namespace Inktide.API.Billing.Application.Models;

public sealed record SubscriptionDto(
    string UserId,
    PlanType Plan,
    SubStatus Status,
    string? Provider,
    DateTime? CurrentPeriodEnd);

/// <summary>Monthly price of a paid plan, in the currency the provider charges.</summary>
public sealed record PlanPrice(PlanType Plan, decimal Amount, string Currency);

public sealed record CreateCheckoutRequest(
    string UserId,
    string UserEmail,
    string SuccessUrl,
    string CancelUrl,
    PlanType Plan);
