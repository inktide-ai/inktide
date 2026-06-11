using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Models;
using Inktide.API.Billing.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Billing.Infrastructure.Repositories;

public sealed class SubscriptionRepository : ISubscriptionRepository
{
    private readonly BillingDbContext _db;
    private readonly TimeProvider _time;

    public SubscriptionRepository(BillingDbContext db, TimeProvider time)
    {
        _db   = db   ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }

    public Task<UserSubscription?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        _db.UserSubscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId, ct);

    public Task<UserSubscription?> GetByProviderSubIdAsync(string providerSubId, CancellationToken ct = default) =>
        _db.UserSubscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.ProviderSubId == providerSubId, ct);

    public async Task UpsertAsync(UserSubscription subscription, CancellationToken ct = default)
    {
        // Atomic upsert — avoids the SELECT + INSERT/UPDATE pattern which has a race
        // condition when two webhook deliveries arrive concurrently for a new user.
        var plan   = subscription.Plan.ToString();
        var status = subscription.Status.ToString();

        await _db.Database.ExecuteSqlAsync($"""
            INSERT INTO billing.user_subscriptions
                (id, user_id, plan, status, provider, provider_sub_id, provider_customer_id,
                 current_period_end, created_at, updated_at)
            VALUES
                ({subscription.Id}, {subscription.UserId}, {plan}::text, {status}::text,
                 {subscription.Provider}, {subscription.ProviderSubId},
                 {subscription.ProviderCustomerId}, {subscription.CurrentPeriodEnd},
                 NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                plan                 = EXCLUDED.plan,
                status               = EXCLUDED.status,
                provider             = EXCLUDED.provider,
                provider_sub_id      = EXCLUDED.provider_sub_id,
                provider_customer_id = EXCLUDED.provider_customer_id,
                current_period_end   = EXCLUDED.current_period_end,
                updated_at           = NOW()
            """, ct).ConfigureAwait(false);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken ct = default)
    {
        await _db.UserSubscriptions
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<UserSubscription>> GetDueForRenewalAsync(
        string provider, DateTime horizon, CancellationToken ct = default)
    {
        return await _db.UserSubscriptions
            .AsNoTracking()
            .Where(s => s.Provider == provider
                     && s.Status == SubStatus.Active
                     && s.CurrentPeriodEnd.HasValue
                     && s.CurrentPeriodEnd <= horizon
                     && s.ProviderSubId != null)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<int> ExpireAllOverdueAsync(CancellationToken ct = default)
    {
        var now = _time.GetUtcNow().UtcDateTime;
        return await _db.UserSubscriptions
            .Where(s => (s.Status == SubStatus.Active || s.Status == SubStatus.Trialing)
                     && s.CurrentPeriodEnd.HasValue
                     && s.CurrentPeriodEnd < now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Status,    SubStatus.Expired)
                .SetProperty(x => x.Plan,      PlanType.Free)
                .SetProperty(x => x.UpdatedAt, now), ct)
            .ConfigureAwait(false);
    }
}
