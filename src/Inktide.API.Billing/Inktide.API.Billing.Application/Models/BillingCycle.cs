namespace Inktide.API.Billing.Application.Models;

/// <summary>Canonical billing cycle durations. Change here propagates to all webhook processors.</summary>
public static class BillingCycle
{
    public static readonly TimeSpan Monthly = TimeSpan.FromDays(30);
}
