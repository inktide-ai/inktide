using Inktide.API.Graph.Domain.Entities;

namespace Inktide.API.Graph.Infrastructure.Execution;

/// <summary>
/// Resolves the input dictionary for a node by merging the initial envelope with
/// explicit edge-wired outputs from upstream nodes.
/// </summary>
internal static class NodeInputResolver
{
    internal static IReadOnlyDictionary<string, object> Build(
        string nodeId,
        GraphDefinition graph,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, object>> nodeOutputs,
        IReadOnlyDictionary<string, object> initialInput)
    {
        var incomingEdges = graph.Edges.Where(e => e.Target == nodeId).ToList();

        // Root nodes (no incoming edges) receive the initial input envelope.
        if (incomingEdges.Count == 0)
            return initialInput;

        var inputs = new Dictionary<string, object>();

        // Always seed with initialInput so metadata keys (card_id, personality, etc.)
        // flow through the whole graph even if not explicitly wired.
        foreach (var kv in initialInput)
            inputs[kv.Key] = kv.Value;

        // Explicit edges override initialInput for their specific target handles.
        foreach (var edge in incomingEdges)
        {
            if (nodeOutputs.TryGetValue(edge.Source, out var sourceOutputs)
                && sourceOutputs.TryGetValue(edge.SourceHandle, out var value))
            {
                inputs[edge.TargetHandle] = value;
            }
        }

        return inputs;
    }
}
