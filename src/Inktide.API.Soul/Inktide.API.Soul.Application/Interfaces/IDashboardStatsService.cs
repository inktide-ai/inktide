namespace Inktide.API.Soul.Application.Interfaces;

public sealed record DashboardStats(int TotalMemories, int MonthlyApiCalls);

public interface IDashboardStatsService
{
    Task<DashboardStats> GetAsync(CancellationToken ct = default);
}
