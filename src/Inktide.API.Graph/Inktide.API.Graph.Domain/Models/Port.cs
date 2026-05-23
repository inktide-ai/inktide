namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// Represents a typed connection point on a node.
/// DataType drives edge compatibility checking: "text" | "audio" | "context".
/// </summary>
public sealed record Port(
    string Name,
    string DataType,
    string? Description = null);
