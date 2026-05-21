namespace Inktide.API.Synapse.Application.Interfaces;

public sealed record SynapseStats(int TotalMemories, int MonthlyApiCalls);

public interface ISynapseStatsPort
{
    Task<SynapseStats> GetAsync(CancellationToken ct = default);
}
