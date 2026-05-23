using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Infrastructure.Services;

public sealed class DashboardStatsService : IDashboardStatsService
{
    private readonly IUsageDailyRepository _usage;
    private readonly IMemoryStatsCache     _memoryStats;
    private readonly TimeProvider          _time;

    public DashboardStatsService(
        IUsageDailyRepository usage,
        IMemoryStatsCache memoryStats,
        TimeProvider time)
    {
        _usage       = usage       ?? throw new ArgumentNullException(nameof(usage));
        _memoryStats = memoryStats ?? throw new ArgumentNullException(nameof(memoryStats));
        _time        = time        ?? throw new ArgumentNullException(nameof(time));
    }

    public async Task<DashboardStats> GetAsync(CancellationToken ct = default)
    {
        var now           = _time.GetUtcNow();
        var monthStart    = new DateOnly(now.Year, now.Month, 1);
        var totalMemories = await _memoryStats.GetTotalCountAsync(ct).ConfigureAwait(false);
        var apiCalls      = await _usage.SumLlmCallsSinceAsync(monthStart, ct).ConfigureAwait(false);
        return new DashboardStats(totalMemories, apiCalls);
    }
}
