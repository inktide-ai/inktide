using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Billing.Infrastructure.Repositories;

public sealed class SubscriptionRepository : ISubscriptionRepository
{
    private readonly BillingDbContext _db;

    public SubscriptionRepository(BillingDbContext db) => _db = db;

    public Task<UserSubscription?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        _db.UserSubscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId, ct);

    public Task<UserSubscription?> GetByProviderSubIdAsync(string providerSubId, CancellationToken ct = default) =>
        _db.UserSubscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.ProviderSubId == providerSubId, ct);

    public async Task UpsertAsync(UserSubscription subscription, CancellationToken ct = default)
    {
        var existing = await _db.UserSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == subscription.UserId, ct)
            .ConfigureAwait(false);

        if (existing is null)
            _db.UserSubscriptions.Add(subscription);
        else
        {
            existing.Plan               = subscription.Plan;
            existing.Status             = subscription.Status;
            existing.Provider           = subscription.Provider;
            existing.ProviderSubId      = subscription.ProviderSubId;
            existing.ProviderCustomerId = subscription.ProviderCustomerId;
            existing.CurrentPeriodEnd   = subscription.CurrentPeriodEnd;
            existing.UpdatedAt          = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken ct = default)
    {
        await _db.UserSubscriptions
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<bool> TryExpireAsync(string userId, CancellationToken ct = default)
    {
        int updated = await _db.UserSubscriptions
            .Where(s => s.UserId == userId
                     && (s.Status == SubStatus.Active || s.Status == SubStatus.Trialing)
                     && s.CurrentPeriodEnd.HasValue
                     && s.CurrentPeriodEnd < DateTime.UtcNow)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Status, SubStatus.Expired)
                .SetProperty(x => x.Plan, PlanType.Free)
                .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), ct)
            .ConfigureAwait(false);
        return updated > 0;
    }
}
