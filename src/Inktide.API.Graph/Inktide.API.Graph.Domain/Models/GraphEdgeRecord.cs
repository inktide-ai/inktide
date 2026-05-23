namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// A directed edge between two nodes in a <see cref="Entities.GraphDefinition"/>.
/// </summary>
public sealed record GraphEdgeRecord(
    string Id,
    string Source,
    string SourceHandle,
    string Target,
    string TargetHandle);
