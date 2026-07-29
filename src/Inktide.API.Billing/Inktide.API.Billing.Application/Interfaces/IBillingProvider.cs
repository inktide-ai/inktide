using Inktide.API.Billing.Application.Models;

namespace Inktide.API.Billing.Application.Interfaces;

/// <summary>
/// Payment provider abstraction. Implement for each processor (Lemon Squeezy, Stripe, Paddle...).
/// </summary>
public interface IBillingProvider
{
    /// <summary>Unique lowercase identifier, e.g. "lemon_squeezy".</summary>
    string ProviderId { get; }

    Task<string> CreateCheckoutUrlAsync(CreateCheckoutRequest request, CancellationToken ct = default);

    /// <returns>Portal URL, or null when the provider does not support customer portals.</returns>
    Task<string?> CreatePortalUrlAsync(string providerCustomerId, string returnUrl, CancellationToken ct = default);
}
