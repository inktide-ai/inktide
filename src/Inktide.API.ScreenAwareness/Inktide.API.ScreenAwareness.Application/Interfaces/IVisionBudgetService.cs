using Inktide.API.Core.Models;

namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>
/// Redis-backed hourly frame budget for per-tenant vision cost control.
/// Uses INCR on <c>screen:budget:{tenantId}:{yyyyMMddHH}</c> with EXPIREAT.
/// </summary>
public interface IVisionBudgetService
{
    /// <summary>
    /// Attempts to consume one frame from the tenant's hourly budget.
    /// Returns false and rolls back the increment when the budget is exceeded.
    /// </summary>
    Task<bool> TryConsumeAsync(Guid tenantId, PlanType plan, int perCardOverride, CancellationToken ct = default);

    Task<long> GetCurrentHourCountAsync(Guid tenantId, CancellationToken ct = default);
}
