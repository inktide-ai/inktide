namespace Inktide.API.Graph.REST.Models;

public sealed record GraphDefinitionDto(
    Guid Id,
    Guid ProjectId,
    IReadOnlyList<GraphNodeDto> Nodes,
    IReadOnlyList<GraphEdgeDto> Edges,
    DateTime UpdatedAt);
