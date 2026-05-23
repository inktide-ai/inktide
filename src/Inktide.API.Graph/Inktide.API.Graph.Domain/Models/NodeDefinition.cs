namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// Static descriptor of a node type returned by <see cref="Contracts.INodeProvider"/>.
/// The frontend reads this to render node shapes, port handles, and inspector fields.
/// </summary>
public sealed record NodeDefinition(
    string Type,
    string ProviderId,
    string Label,
    string Description,
    IReadOnlyList<Port> Inputs,
    IReadOnlyList<Port> Outputs,
    IReadOnlyDictionary<string, ConfigFieldSchema> ConfigSchema);
