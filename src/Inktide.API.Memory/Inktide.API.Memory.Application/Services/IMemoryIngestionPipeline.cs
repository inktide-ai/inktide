using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Memory.Application.Services;

/// <summary>
/// Inbound port - processes a single <see cref="MemoryIngestionJob"/>: fact extraction,
/// embedding generation, and dual-store persistence (Qdrant + PostgreSQL).
/// Resolved per-scope by <c>MemoryIngestionWorker</c>.
/// </summary>
public interface IMemoryIngestionPipeline
{
    Task ProcessAsync(MemoryIngestionJob job, CancellationToken ct);
}
