using Inktide.API.Graph.Domain.Entities;

namespace Inktide.API.Graph.Domain.Contracts;

public interface IGraphRepository
{
    /// <summary>Used by the pipeline (Synapse) — no user ownership check.</summary>
    Task<GraphDefinition?> FindByProjectIdAsync(Guid projectId, CancellationToken ct = default);

    /// <summary>Used by the REST API — returns only if the caller owns the graph.</summary>
    Task<GraphDefinition?> FindByProjectAndUserAsync(Guid projectId, Guid userId, CancellationToken ct = default);

    Task<GraphDefinition> UpsertAsync(GraphDefinition graph, CancellationToken ct = default);
}
