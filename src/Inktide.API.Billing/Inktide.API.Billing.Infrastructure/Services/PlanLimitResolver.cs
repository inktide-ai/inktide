using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Contracts;

namespace Inktide.API.Billing.Infrastructure.Services;

public sealed class PlanLimitResolver : IUserPlanResolver
{
    private readonly ISubscriptionService _subscriptions;

    public PlanLimitResolver(ISubscriptionService subscriptions) =>
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));

    public async Task<PlanLimits> GetLimitsAsync(string userId, CancellationToken ct = default)
    {
        var sub = await _subscriptions.GetSubscriptionAsync(userId, ct).ConfigureAwait(false);
        return sub.Plan switch
        {
            PlanType.Starter => PlanLimits.Starter,
            PlanType.Pro     => PlanLimits.Pro,
            _                => PlanLimits.Free,
        };
    }
}
