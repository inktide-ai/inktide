namespace Inktide.API.Graph.REST.Models;

public sealed record GraphNodeDto(
    string Id,
    string Type,
    string ProviderId,
    Dictionary<string, object> Config,
    NodePositionDto Position);

public sealed record NodePositionDto(double X, double Y);
