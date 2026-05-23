using Inktide.API.Billing.Application.Models;

namespace Inktide.API.Billing.Application.Interfaces;

public interface ISubscriptionService
{
    /// <summary>Returns the current subscription, or a synthetic Free record when none exists.</summary>
    Task<SubscriptionDto> GetSubscriptionAsync(string userId, CancellationToken ct = default);

    /// <summary>Creates a hosted checkout URL for upgrading to Pro.</summary>
    Task<string> CreateCheckoutUrlAsync(string userId, string userEmail, string returnUrl, CancellationToken ct = default);

    /// <summary>Creates a customer portal URL to manage billing. Returns null when no active subscription.</summary>
    Task<string?> CreatePortalUrlAsync(string userId, string returnUrl, CancellationToken ct = default);
}
