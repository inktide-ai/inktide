using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Services;

public sealed class SubscriptionService : ISubscriptionService
{
    private readonly ISubscriptionRepository _subscriptions;
    private readonly IBillingProvider _provider;
    private readonly BillingSettings _billing;
    private readonly ILogger<SubscriptionService> _logger;

    public SubscriptionService(
        ISubscriptionRepository subscriptions,
        IBillingProvider provider,
        BillingSettings billing,
        ILogger<SubscriptionService> logger)
    {
        _subscriptions = subscriptions;
        _provider      = provider;
        _billing       = billing;
        _logger        = logger;
    }

    public async Task<SubscriptionDto> GetSubscriptionAsync(string userId, CancellationToken ct = default)
    {
        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false);

        if (sub is null)
            return new SubscriptionDto(userId, PlanType.Free, SubStatus.Active, null, null);

        if (sub.IsProActive() && sub.CurrentPeriodEnd.HasValue && sub.CurrentPeriodEnd < DateTime.UtcNow)
        {
            await _subscriptions.TryExpireAsync(userId, ct).ConfigureAwait(false);
            sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false)
                  ?? new UserSubscription { UserId = userId, Status = SubStatus.Expired, Plan = PlanType.Free };
        }

        return new SubscriptionDto(userId, sub.Plan, sub.Status, sub.Provider, sub.CurrentPeriodEnd);
    }

    public async Task<string> CreateCheckoutUrlAsync(
        string userId,
        string userEmail,
        string returnUrl,
        CancellationToken ct = default)
    {
        var request = new CreateCheckoutRequest(
            UserId:     userId,
            UserEmail:  userEmail,
            SuccessUrl: string.IsNullOrWhiteSpace(returnUrl) ? _billing.SuccessUrl : returnUrl,
            CancelUrl:  _billing.CancelUrl);

        return await _provider.CreateCheckoutUrlAsync(request, ct).ConfigureAwait(false);
    }

    public async Task<string?> CreatePortalUrlAsync(
        string userId,
        string returnUrl,
        CancellationToken ct = default)
    {
        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false);
        if (sub?.ProviderCustomerId is null)
            return null;

        return await _provider.CreatePortalUrlAsync(sub.ProviderCustomerId, returnUrl, ct).ConfigureAwait(false);
    }
}
