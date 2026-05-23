using System.Security.Claims;
using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Inktide.API.Graph.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Graph.REST.Controllers;

[ApiController]
[Route("api/graphs")]
[Produces("application/json")]
[Authorize]
public sealed class GraphController : ControllerBase
{
    private readonly IGraphService _graphService;
    private readonly INodeProviderRegistry _nodeProviderRegistry;

    public GraphController(
        IGraphService graphService,
        INodeProviderRegistry nodeProviderRegistry)
    {
        _graphService = graphService;
        _nodeProviderRegistry = nodeProviderRegistry;
    }

    /// <summary>Returns all registered node types for the graph editor sidebar.</summary>
    [HttpGet("nodes")]
    [ProducesResponseType(typeof(IReadOnlyList<object>), StatusCodes.Status200OK)]
    public IActionResult GetNodeCatalog()
    {
        var definitions = _nodeProviderRegistry.GetAll()
            .Select(p => p.GetDefinition())
            .ToList();

        return Ok(definitions);
    }

    /// <summary>Returns the saved graph for a project owned by the caller, or 404 if none exists.</summary>
    [HttpGet("{projectId:guid}")]
    [ProducesResponseType(typeof(GraphDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGraph(Guid projectId, CancellationToken ct)
    {
        var userId = GetUserId();
        var graph = await _graphService.GetByProjectAsync(projectId, userId, ct);
        if (graph is null)
            return NotFound();

        return Ok(MapToDto(graph));
    }

    /// <summary>Creates or replaces the graph for a project owned by the caller.</summary>
    [HttpPut("{projectId:guid}")]
    [ProducesResponseType(typeof(GraphDefinitionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SaveGraph(
        Guid projectId,
        [FromBody] SaveGraphRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();

        var nodes = request.Nodes.Select(n => new GraphNodeRecord(
            n.Id,
            n.Type,
            n.ProviderId,
            n.Config,
            new NodePosition(n.Position.X, n.Position.Y)));

        var edges = request.Edges.Select(e => new GraphEdgeRecord(
            e.Id,
            e.Source,
            e.SourceHandle,
            e.Target,
            e.TargetHandle));

        var saved = await _graphService.SaveAsync(projectId, userId, nodes, edges, ct);
        return Ok(MapToDto(saved));
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

    private static GraphDefinitionDto MapToDto(Domain.Entities.GraphDefinition g) =>
        new(
            g.Id,
            g.ProjectId,
            g.Nodes.Select(n => new GraphNodeDto(
                n.Id, n.Type, n.ProviderId,
                new Dictionary<string, object>(n.Config),
                new NodePositionDto(n.Position.X, n.Position.Y))).ToList(),
            g.Edges.Select(e => new GraphEdgeDto(
                e.Id, e.Source, e.SourceHandle, e.Target, e.TargetHandle)).ToList(),
            g.UpdatedAt);
}
