using Inktide.API.Billing.Application.Models;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Settings;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.ScreenAwareness.Infrastructure.Redis;

public sealed class RedisVisionBudgetService : IVisionBudgetService
{

    private readonly IConnectionMultiplexer _redis;
    private readonly ScreenAwarenessSettings _settings;

    public RedisVisionBudgetService(
        IConnectionMultiplexer redis,
        IOptions<ScreenAwarenessSettings> settings)
    {
        _redis    = redis    ?? throw new ArgumentNullException(nameof(redis));
        _settings = settings.Value;
    }

    private static string BudgetKey(Guid tenantId)
    {
        var hourBucket = DateTimeOffset.UtcNow.ToString("yyyyMMddHH");
        return $"screen:budget:{tenantId:N}:{hourBucket}";
    }

    public async Task<bool> TryConsumeAsync(Guid tenantId, PlanType plan, int perCardOverride, CancellationToken ct = default)
    {
        var db  = _redis.GetDatabase();
        var key = BudgetKey(tenantId);

        var newCount = await db.StringIncrementAsync(key);

        if (newCount == 1)
        {
            // First increment this hour — set expiry to top of next UTC hour + 5 min buffer.
            var now    = DateTimeOffset.UtcNow;
            var expiry = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, 0, 0, TimeSpan.Zero)
                             .AddHours(1)
                             .AddMinutes(5);
            await db.KeyExpireAsync(key, expiry.UtcDateTime);
        }

        var limit = perCardOverride > 0
            ? perCardOverride
            : plan == PlanType.Pro
                ? _settings.ProPlanHourlyBudget
                : _settings.FreePlanHourlyBudget;

        if (newCount > limit)
        {
            await db.StringDecrementAsync(key);
            return false;
        }

        return true;
    }

    public async Task<long> GetCurrentHourCountAsync(Guid tenantId, CancellationToken ct = default)
    {
        var db  = _redis.GetDatabase();
        var val = await db.StringGetAsync(BudgetKey(tenantId));
        return val.TryParse(out long count) ? count : 0;
    }

}
