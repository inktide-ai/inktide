using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

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
        const string sql = """
            INSERT INTO billing.user_subscriptions
                (id, user_id, plan, status, provider, provider_sub_id, provider_customer_id,
                 current_period_end, created_at, updated_at)
            VALUES
                (@id, @userId, @plan::text, @status::text, @provider, @providerSubId,
                 @providerCustomerId, @periodEnd, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                plan                 = EXCLUDED.plan,
                status               = EXCLUDED.status,
                provider             = EXCLUDED.provider,
                provider_sub_id      = EXCLUDED.provider_sub_id,
                provider_customer_id = EXCLUDED.provider_customer_id,
                current_period_end   = EXCLUDED.current_period_end,
                updated_at           = NOW()
            """;

        await _db.Database.ExecuteSqlRawAsync(sql,
        [
            new NpgsqlParameter("id",                 subscription.Id),
            new NpgsqlParameter("userId",             subscription.UserId),
            new NpgsqlParameter("plan",               subscription.Plan.ToString()),
            new NpgsqlParameter("status",             subscription.Status.ToString()),
            new NpgsqlParameter("provider",           subscription.Provider),
            new NpgsqlParameter("providerSubId",      (object?)subscription.ProviderSubId      ?? DBNull.Value),
            new NpgsqlParameter("providerCustomerId", (object?)subscription.ProviderCustomerId ?? DBNull.Value),
            new NpgsqlParameter("periodEnd",          (object?)subscription.CurrentPeriodEnd   ?? DBNull.Value)
                { NpgsqlDbType = NpgsqlDbType.TimestampTz },
        ], ct).ConfigureAwait(false);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken ct = default)
    {
        await _db.UserSubscriptions
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync(ct)
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
