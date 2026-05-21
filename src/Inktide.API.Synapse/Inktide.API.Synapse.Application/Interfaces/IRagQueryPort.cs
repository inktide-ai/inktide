using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

public interface IRagQueryPort
{
    Task<IReadOnlyList<SynapseMemoryFact>> QueryAsync(
        Guid characterId,
        string text,
        int maxResults,
        CancellationToken ct = default);
}
