using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Application.Interfaces;

public interface IGraphService
{
    Task<GraphDefinition?> GetByProjectAsync(Guid projectId, Guid userId, CancellationToken ct = default);

    Task<GraphDefinition?> SaveAsync(
        Guid projectId,
        Guid userId,
        IEnumerable<GraphNodeRecord> nodes,
        IEnumerable<GraphEdgeRecord> edges,
        CancellationToken ct = default);
}
