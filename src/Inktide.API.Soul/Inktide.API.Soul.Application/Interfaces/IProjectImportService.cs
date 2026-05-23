using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Atomically creates an AiCard and, when a graph is included, enqueues a GraphImport outbox event
/// in the same DB transaction so the Graph bounded context receives it reliably.
/// </summary>
public interface IProjectImportService
{
    Task<AiCard> ImportAsync(
        Guid userId,
        AiCard card,
        string? graphPayloadJson,
        CancellationToken ct = default);
}
