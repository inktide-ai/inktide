namespace Inktide.API.Core.Contracts;

public sealed record GraphExportData(IReadOnlyList<object> Nodes, IReadOnlyList<object> Edges);

/// <summary>
/// Cross-context contract: allows Soul.REST to fetch graph data for export
/// without a compile-time dependency on Graph.Domain.
/// Implemented by Graph.Infrastructure.
/// </summary>
public interface IGraphByProjectQuery
{
    Task<GraphExportData?> FindByProjectIdAsync(Guid projectId, CancellationToken ct = default);
}
