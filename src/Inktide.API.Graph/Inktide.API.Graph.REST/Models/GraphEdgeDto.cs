namespace Inktide.API.Graph.REST.Models;

public sealed record GraphEdgeDto(
    string Id,
    string Source,
    string SourceHandle,
    string Target,
    string TargetHandle);
