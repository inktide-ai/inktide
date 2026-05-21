using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

public sealed class MemoryRagAdapter : IRagQueryPort
{
    private readonly IMemoryQueryService _memory;

    public MemoryRagAdapter(IMemoryQueryService memory)
    {
        _memory = memory ?? throw new ArgumentNullException(nameof(memory));
    }

    public async Task<IReadOnlyList<SynapseMemoryFact>> QueryAsync(
        Guid characterId,
        string text,
        int maxResults,
        CancellationToken ct = default)
    {
        var records = await _memory.QueryAsync(characterId, text, maxResults, ct);
        return records
            .Select(r => new SynapseMemoryFact(r.FactText, r.Score, r.Category, new DateTimeOffset(r.RememberedAt, TimeSpan.Zero)))
            .ToList();
    }
}
