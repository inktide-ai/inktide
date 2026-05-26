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
///   1. Compute topological batches (Kahn's algorithm via <see cref="TopologicalBatcher"/>).
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
        var nodeLookup  = graph.Nodes.ToDictionary(n => n.Id);
        var nodeOutputs = new Dictionary<string, IReadOnlyDictionary<string, object>>();
        var batches     = TopologicalBatcher.Compute(graph);

        foreach (var batch in batches)
        {
            ct.ThrowIfCancellationRequested();

            foreach (var nodeId in batch)
                yield return new NodeStartedEvent(nodeId);

            var ctxMap = new Dictionary<string, NodeExecutionContext>(batch.Count);
            foreach (var nodeId in batch)
            {
                var inputs = NodeInputResolver.Build(nodeId, graph, nodeOutputs, initialInput);
                ctxMap[nodeId] = new NodeExecutionContext(inputs, nodeLookup[nodeId].Config, new HandlerServices(services));
            }

            var tasks = batch.Select(nodeId =>
                ExecuteNodeAsync(nodeId, nodeLookup[nodeId], ctxMap[nodeId], ct)
            ).ToArray();

            var results = await Task.WhenAll(tasks);

            foreach (var result in results)
            {
                if (result is NodeCompletedEvent completed)
                    nodeOutputs[completed.NodeId] = completed.Outputs;

                yield return result;
            }
        }

        yield return new GraphCompletedEvent();
    }

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
}
