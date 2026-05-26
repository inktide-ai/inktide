using Inktide.API.Graph.Domain.Entities;

namespace Inktide.API.Graph.Infrastructure.Execution;

/// <summary>
/// Computes topological batches from a <see cref="GraphDefinition"/> using Kahn's algorithm.
/// All nodes in a batch have their dependencies satisfied and can execute in parallel.
/// Throws <see cref="InvalidOperationException"/> if the graph contains a cycle.
/// </summary>
internal static class TopologicalBatcher
{
    internal static List<List<string>> Compute(GraphDefinition graph)
    {
        var nodeIds   = graph.Nodes.Select(n => n.Id).ToHashSet();
        var inDegree  = nodeIds.ToDictionary(id => id, _ => 0);
        var adjacency = nodeIds.ToDictionary(id => id, _ => new List<string>());

        foreach (var edge in graph.Edges)
        {
            if (nodeIds.Contains(edge.Source) && nodeIds.Contains(edge.Target))
            {
                adjacency[edge.Source].Add(edge.Target);
                inDegree[edge.Target]++;
            }
        }

        var batches   = new List<List<string>>();
        var processed = 0;

        var currentBatch = inDegree
            .Where(kv => kv.Value == 0)
            .Select(kv => kv.Key)
            .ToList();

        while (currentBatch.Count > 0)
        {
            batches.Add(currentBatch);
            processed += currentBatch.Count;

            var nextBatch = new List<string>();
            foreach (var nodeId in currentBatch)
            {
                foreach (var successor in adjacency[nodeId])
                {
                    if (--inDegree[successor] == 0)
                        nextBatch.Add(successor);
                }
            }

            currentBatch = nextBatch;
        }

        if (processed != nodeIds.Count)
            throw new InvalidOperationException(
                $"Graph for {graph.ProjectId} contains a cycle — cannot execute.");

        return batches;
    }
}
