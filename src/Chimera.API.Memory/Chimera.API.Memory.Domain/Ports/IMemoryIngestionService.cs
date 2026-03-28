using Chimera.API.Memory.Domain.Models;

namespace Chimera.API.Memory.Domain.Ports;

/// <summary>
/// Inbound port — non-blocking enqueue of a conversation turn for async fact extraction and storage.
/// Called fire-and-forget from downstream LLM stages when wired.
/// </summary>
public interface IMemoryIngestionService
{
    ValueTask EnqueueAsync(MemoryIngestionJob job, CancellationToken ct = default);
}
