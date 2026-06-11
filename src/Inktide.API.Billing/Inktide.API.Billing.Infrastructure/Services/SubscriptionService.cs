using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Models;
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
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
        _provider      = provider      ?? throw new ArgumentNullException(nameof(provider));
        _billing       = billing       ?? throw new ArgumentNullException(nameof(billing));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<SubscriptionDto> GetSubscriptionAsync(string userId, CancellationToken ct = default)
    {
        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false);

        if (sub is null)
            return new SubscriptionDto(userId, PlanType.Free, SubStatus.Active, null, null);

        return new SubscriptionDto(userId, sub.Plan, sub.Status, sub.Provider, sub.CurrentPeriodEnd);
    }

    public async Task<string> CreateCheckoutUrlAsync(
        string userId,
        string userEmail,
        string returnUrl,
        PlanType plan,
        CancellationToken ct = default)
    {
        var request = new CreateCheckoutRequest(
            UserId:     userId,
            UserEmail:  userEmail,
            SuccessUrl: string.IsNullOrWhiteSpace(returnUrl) ? _billing.SuccessUrl : returnUrl,
            CancelUrl:  _billing.CancelUrl,
            Plan:       plan);

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
