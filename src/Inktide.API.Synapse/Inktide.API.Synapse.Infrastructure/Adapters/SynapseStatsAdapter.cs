using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Synapse.Application.Interfaces;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

internal sealed class SynapseStatsAdapter : ISynapseStatsPort
{
    private readonly IDashboardStatsService _stats;

    public SynapseStatsAdapter(IDashboardStatsService stats)
    {
        _stats = stats ?? throw new ArgumentNullException(nameof(stats));
    }

    public async Task<SynapseStats> GetAsync(CancellationToken ct = default)
    {
        var result = await _stats.GetAsync(ct);
        return new SynapseStats(result.TotalMemories, result.MonthlyApiCalls);
    }
}
