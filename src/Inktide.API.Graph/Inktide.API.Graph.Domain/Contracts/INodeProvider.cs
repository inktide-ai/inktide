using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Contracts;

/// <summary>
/// Describes a node type and its capabilities.
/// Implement this interface to register a new node type (built-in or plugin).
/// </summary>
public interface INodeProvider
{
    /// <summary>Logical category: "input" | "llm" | "tts" | "output".</summary>
    string Type { get; }

    /// <summary>Unique provider identifier within the type. Built-ins use "core".</summary>
    string ProviderId { get; }

    /// <summary>Returns the static definition used by the graph UI and runtime.</summary>
    NodeDefinition GetDefinition();
}
