using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Infrastructure.Services;

public sealed class DashboardStatsService : IDashboardStatsService
{
    private readonly IUsageDailyRepository _usage;
    private readonly IMemoryMetadataRepository _memory;

    public DashboardStatsService(IUsageDailyRepository usage, IMemoryMetadataRepository memory)
    {
        _usage  = usage;
        _memory = memory;
    }

    public async Task<DashboardStats> GetAsync(CancellationToken ct = default)
    {
        var monthStart    = new DateOnly(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var totalMemories = await _memory.CountTotalAsync(ct);
        var apiCalls      = await _usage.SumLlmCallsSinceAsync(monthStart, ct);
        return new DashboardStats(totalMemories, apiCalls);
    }
}
