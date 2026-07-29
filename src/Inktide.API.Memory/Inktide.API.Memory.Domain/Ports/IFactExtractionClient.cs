using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port - extracts structured facts from a conversation turn via the Scribe Python worker.
/// Calls <c>POST /api/v1/extract-facts</c>.
/// </summary>
public interface IFactExtractionClient
{
    Task<IReadOnlyList<ExtractedFact>> ExtractFactsAsync(
        MemoryIngestionJob job,
        CancellationToken ct = default);
}
