using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

public sealed class GraphPluginEnrichmentAdapter : IGraphPluginEnrichmentPort
{
    private static readonly HashSet<string> EnrichmentTypes =
        new(StringComparer.OrdinalIgnoreCase) { "plugin", "context_builder" };

    private readonly IGraphRepository _graphs;
    private readonly IGraphExecutor _executor;
    private readonly IServiceProvider _services;
    private readonly ILogger<GraphPluginEnrichmentAdapter> _logger;

    public GraphPluginEnrichmentAdapter(
        IGraphRepository graphs,
        IGraphExecutor executor,
        IServiceProvider services,
        ILogger<GraphPluginEnrichmentAdapter> logger)
    {
        _graphs   = graphs   ?? throw new ArgumentNullException(nameof(graphs));
        _executor = executor ?? throw new ArgumentNullException(nameof(executor));
        _services = services ?? throw new ArgumentNullException(nameof(services));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }

    public async IAsyncEnumerable<IReadOnlyDictionary<string, object>> EnrichAsync(
        Guid projectId,
        IReadOnlyDictionary<string, object> input,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
    {
        var graph = await _graphs.FindByProjectIdAsync(projectId, ct);
        if (graph is null)
        {
            _logger.LogDebug("GraphPluginEnrichmentAdapter: no saved graph for project {ProjectId}", projectId);
            yield break;
        }

        var enrichmentNodeIds = graph.Nodes
            .Where(n => EnrichmentTypes.Contains(n.Type))
            .Select(n => n.Id)
            .ToHashSet();

        if (enrichmentNodeIds.Count == 0)
        {
            _logger.LogDebug("GraphPluginEnrichmentAdapter: graph for project {ProjectId} has no plugin nodes", projectId);
            yield break;
        }

        var subNodes = graph.Nodes.Where(n => enrichmentNodeIds.Contains(n.Id));
        var subEdges = graph.Edges.Where(e =>
            enrichmentNodeIds.Contains(e.Source) && enrichmentNodeIds.Contains(e.Target));

        var subGraph = GraphDefinition.Create(projectId, Guid.Empty, subNodes, subEdges);

        await foreach (var evt in _executor.ExecuteAsync(subGraph, input, _services, ct))
        {
            if (evt is NodeCompletedEvent completed)
                yield return MapOutputs(completed.Outputs);
        }
    }

    private static IReadOnlyDictionary<string, object> MapOutputs(IReadOnlyDictionary<string, object> raw)
    {
        var mapped = new Dictionary<string, object>(raw.Count);
        foreach (var (key, value) in raw)
        {
            if (key == "memories" && value is IReadOnlyList<MemoryRecord> records)
            {
                mapped[key] = records
                    .Select(r => new SynapseMemoryFact(r.FactText, r.Score, r.Category, new DateTimeOffset(r.RememberedAt, TimeSpan.Zero)))
                    .ToArray();
            }
            else
            {
                mapped[key] = value;
            }
        }
        return mapped;
    }
}
