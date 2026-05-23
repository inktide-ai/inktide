namespace Inktide.API.Graph.REST.Models;

public sealed record SaveGraphRequest(
    IReadOnlyList<GraphNodeDto> Nodes,
    IReadOnlyList<GraphEdgeDto> Edges);
