using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

public interface IMemoryIngestionPort
{
    ValueTask EnqueueAsync(SynapseMemoryIngestionRequest request, CancellationToken ct = default);
}
