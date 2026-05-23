namespace Inktide.API.Core.Contracts;

public interface IProjectGraphExportQuery
{
    Task<GraphExportSnapshot?> FindByProjectIdAsync(Guid projectId, CancellationToken ct = default);
}

/// <summary>Pre-serialized brain.json payload. Graph.Infrastructure builds it; Project never sees GraphNodeRecord/GraphEdgeRecord.</summary>
public sealed record GraphExportSnapshot(string BrainJson);
