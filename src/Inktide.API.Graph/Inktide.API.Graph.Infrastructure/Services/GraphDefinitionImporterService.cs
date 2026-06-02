using System.Text.Json;
using Inktide.API.Core.Generators;
using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Domain;
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
        var payload = JsonSerializer.Deserialize<GraphPayloadDto>(graphPayloadJson,
            GraphJsonSerializerOptions.CamelCase)
            ?? throw new ArgumentException("Invalid graph payload JSON", nameof(graphPayloadJson));

        var nodes = (payload.Nodes ?? []).Select(n => new GraphNodeRecord(
            n.Id ?? IdGenerator.New().ToString(),
            n.Type ?? NodeTypes.Input,
            n.ProviderId ?? "core",
            n.Config ?? [],
            n.Position is { } p ? new NodePosition(p.X, p.Y) : new NodePosition(0, 0)
        )).ToList();

        var edges = (payload.Edges ?? []).Select(e => new GraphEdgeRecord(
            e.Id ?? IdGenerator.New().ToString(),
            e.Source ?? string.Empty,
            e.SourceHandle ?? string.Empty,
            e.Target ?? string.Empty,
            e.TargetHandle ?? string.Empty
        )).ToList();

        var graph    = GraphDefinition.Create(projectId, userId, nodes, edges);
        var existing = await _graphs.FindByProjectIdAsync(projectId, ct).ConfigureAwait(false);
        await _graphs.UpsertAsync(graph, existing, ct).ConfigureAwait(false);

        _logger.LogInformation(
            "GraphDefinitionImporterService: imported graph for project {ProjectId} ({NodeCount} nodes, {EdgeCount} edges)",
            projectId, nodes.Count, edges.Count);
    }

    private sealed record GraphPayloadDto(List<NodeDto>? Nodes, List<EdgeDto>? Edges);
    private sealed record NodeDto(string? Id, string? Type, string? ProviderId,
        PositionDto? Position, Dictionary<string, object>? Config);
    private sealed record PositionDto(double X, double Y);
    private sealed record EdgeDto(string? Id, string? Source, string? SourceHandle,
        string? Target, string? TargetHandle);
}
