namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// A node instance saved inside a <see cref="Entities.GraphDefinition"/>.
/// Type + ProviderId address the handler; Config holds the inspector values.
/// </summary>
public sealed record GraphNodeRecord(
    string Id,
    string Type,
    string ProviderId,
    IReadOnlyDictionary<string, object> Config,
    NodePosition Position);
