using System.Runtime.CompilerServices;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Execution;

/// <summary>
/// Executes a <see cref="GraphDefinition"/> in topological order with parallel batching:
/// all nodes whose dependencies are satisfied at the same time are executed concurrently.
///
/// Execution model:
///   1. Compute topological batches (Kahn's algorithm, all zero-in-degree nodes = batch).
///   2. For each batch: launch all node handlers in parallel, await completion.
///   3. Merge outputs from the batch into the shared output map.
///   4. Pass merged outputs as inputs to the next batch.
/// </summary>
public sealed class GraphExecutorService : IGraphExecutor
{
    private readonly INodeHandlerRegistry _handlers;
    private readonly ILogger<GraphExecutorService> _logger;

    public GraphExecutorService(INodeHandlerRegistry handlers, ILogger<GraphExecutorService> logger)
    {
        _handlers = handlers;
        _logger   = logger;
    }

    public async IAsyncEnumerable<GraphExecutionEvent> ExecuteAsync(
        GraphDefinition graph,
        IReadOnlyDictionary<string, object> initialInput,
        IServiceProvider services,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        // nodeOutputs[nodeId] = outputs produced by that node
        var nodeOutputs  = new Dictionary<string, IReadOnlyDictionary<string, object>>();
        var batches      = TopologicalBatches(graph);

        foreach (var batch in batches)
        {
            ct.ThrowIfCancellationRequested();

            // Emit started events for all nodes in this batch.
            foreach (var nodeId in batch)
                yield return new NodeStartedEvent(nodeId);

            // Build (nodeId → NodeExecutionContext) for the batch before launching tasks.
            var ctxMap = new Dictionary<string, NodeExecutionContext>(batch.Count);
            foreach (var nodeId in batch)
            {
                var node   = graph.Nodes.First(n => n.Id == nodeId);
                var inputs = BuildInputs(nodeId, graph, nodeOutputs, initialInput);
                ctxMap[nodeId] = new NodeExecutionContext(inputs, node.Config, services);
            }

            // Execute all nodes in the batch concurrently.
            var tasks = batch.Select(nodeId =>
            {
                var node = graph.Nodes.First(n => n.Id == nodeId);
                return ExecuteNodeAsync(nodeId, node, ctxMap[nodeId], ct);
            }).ToArray();

            var results = await Task.WhenAll(tasks);

            // Collect outputs and emit completion events.
            foreach (var result in results)
            {
                if (result is NodeCompletedEvent completed)
                    nodeOutputs[completed.NodeId] = completed.Outputs;

                yield return result;
            }
        }

        yield return new GraphCompletedEvent();
    }

    // ── Node execution ────────────────────────────────────────────────────────

    private async Task<GraphExecutionEvent> ExecuteNodeAsync(
        string nodeId,
        GraphNodeRecord node,
        NodeExecutionContext ctx,
        CancellationToken ct)
    {
        INodeHandler handler;
        try
        {
            handler = _handlers.Get(node.Type, node.ProviderId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "No handler for node {NodeId} ({Type}/{ProviderId})",
                nodeId, node.Type, node.ProviderId);
            return new NodeFailedEvent(nodeId, ex.Message);
        }

        try
        {
            await handler.ExecuteAsync(ctx, ct);
            return new NodeCompletedEvent(nodeId, ctx.GetOutputs());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Node {NodeId} threw during execution", nodeId);
            return new NodeFailedEvent(nodeId, ex.Message);
        }
    }

    // ── Input resolution ──────────────────────────────────────────────────────

    private static IReadOnlyDictionary<string, object> BuildInputs(
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

    // ── Topological batch sort (Kahn's algorithm) ─────────────────────────────

    /// <summary>
    /// Returns batches of node IDs. All nodes in a batch can run in parallel.
    /// Throws <see cref="InvalidOperationException"/> if the graph contains a cycle.
    /// </summary>
    private static List<List<string>> TopologicalBatches(GraphDefinition graph)
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

        // Seed: all zero-in-degree nodes form the first batch.
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
