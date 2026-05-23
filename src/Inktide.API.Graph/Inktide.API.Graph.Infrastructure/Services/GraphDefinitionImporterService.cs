using Inktide.API.Core.Generators;
using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Services;

/// <summary>
/// Receives a graph import payload from Soul's outbox and persists it to GraphDbContext.
/// Implements IGraphDefinitionImporter (defined in Core) so Soul.Infrastructure has no compile-time
/// dependency on Graph.Infrastructure.
/// </summary>
public sealed class GraphDefinitionImporterService : IGraphDefinitionImporter
{
    private readonly IGraphRepository _graphs;
    private readonly ILogger<GraphDefinitionImporterService> _logger;

    public GraphDefinitionImporterService(
        IGraphRepository graphs,
        ILogger<GraphDefinitionImporterService> logger)
    {
        _graphs = graphs ?? throw new ArgumentNullException(nameof(graphs));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ImportAsync(Guid projectId, Guid userId, string graphPayloadJson, CancellationToken ct = default)

    {
        var nodes = new List<GraphNodeRecord>();
        var edges = new List<GraphEdgeRecord>();

        using var doc = JsonDocument.Parse(graphPayloadJson);
        var root = doc.RootElement;

        if (root.TryGetProperty("nodes", out var nodesEl) && nodesEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in nodesEl.EnumerateArray())
            {
                var id       = item.TryGetProperty("id", out var idEl)       ? idEl.GetString() ?? IdGenerator.New().ToString() : IdGenerator.New().ToString();
                var type     = item.TryGetProperty("type", out var typeEl)   ? typeEl.GetString() ?? "input" : "input";
                var provider = item.TryGetProperty("providerId", out var pvEl) ? pvEl.GetString() ?? "core" : "core";

                var pos = new NodePosition(0, 0);
                if (item.TryGetProperty("position", out var posEl) && posEl.ValueKind == JsonValueKind.Object)
                {
                    var x = posEl.TryGetProperty("x", out var xEl) ? xEl.GetDouble() : 0;
                    var y = posEl.TryGetProperty("y", out var yEl) ? yEl.GetDouble() : 0;
                    pos = new NodePosition(x, y);
                }

                var cfg = new Dictionary<string, object>();
                if (item.TryGetProperty("config", out var cfgEl) && cfgEl.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in cfgEl.EnumerateObject())
                        cfg[prop.Name] = prop.Value.ToString();
                }

                nodes.Add(new GraphNodeRecord(id, type, provider, cfg, pos));
            }
        }

        if (root.TryGetProperty("edges", out var edgesEl) && edgesEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in edgesEl.EnumerateArray())
            {
                edges.Add(new GraphEdgeRecord(
                    item.TryGetProperty("id", out var idEl)             ? idEl.GetString()           ?? IdGenerator.New().ToString() : IdGenerator.New().ToString(),
                    item.TryGetProperty("source", out var srcEl)        ? srcEl.GetString()           ?? string.Empty : string.Empty,
                    item.TryGetProperty("sourceHandle", out var shEl)   ? shEl.GetString()            ?? string.Empty : string.Empty,
                    item.TryGetProperty("target", out var tEl)          ? tEl.GetString()             ?? string.Empty : string.Empty,
                    item.TryGetProperty("targetHandle", out var thEl)   ? thEl.GetString()            ?? string.Empty : string.Empty));
            }
        }

        var graph = GraphDefinition.Create(projectId, userId, nodes, edges);
        await _graphs.UpsertAsync(graph, ct).ConfigureAwait(false);

        _logger.LogInformation(
            "GraphDefinitionImporterService: imported graph for project {ProjectId} ({NodeCount} nodes, {EdgeCount} edges)",
            projectId, nodes.Count, edges.Count);
    }
}
