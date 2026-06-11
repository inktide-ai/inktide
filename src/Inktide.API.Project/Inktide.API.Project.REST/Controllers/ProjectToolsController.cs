using System.Security.Claims;
using System.Text.Json;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId:guid}/tools")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectToolsController(
    IProjectCrudService projects,
    IProjectToolService tools,
    ILogger<ProjectToolsController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectToolResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid projectId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var list = await tools.ListAsync(projectId, ct);
        return Ok(list.Select(MapTool).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectToolResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] UpsertToolRequest request, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var saved = await tools.CreateAsync(projectId, request.ToolName, SerializeJson(request.ToolConfig), request.IsEnabled, ct);
        return Created($"/api/v1/projects/{projectId}/tools/{saved.Id}", MapTool(saved));
    }

    [HttpPut("{toolId:guid}")]
    [ProducesResponseType(typeof(ProjectToolResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid projectId, Guid toolId, [FromBody] UpsertToolRequest request, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var existing = await tools.GetByIdAsync(toolId, ct);
        if (existing is null || existing.ProjectId != projectId) return NotFound();

        var saved = await tools.UpdateAsync(toolId, request.ToolName, SerializeJson(request.ToolConfig), request.IsEnabled, ct);
        return Ok(MapTool(saved));
    }

    [HttpDelete("{toolId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid projectId, Guid toolId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var existing = await tools.GetByIdAsync(toolId, ct);
        if (existing is null || existing.ProjectId != projectId) return NotFound();

        await tools.DeleteAsync(toolId, ct);
        return NoContent();
    }

    private ProjectToolResponse MapTool(Domain.Entities.ProjectTool t) => new()
    {
        Id         = t.Id,
        ProjectId  = t.ProjectId,
        ToolName   = t.ToolName,
        ToolConfig = ParseJson(t.ToolConfig),
        IsEnabled  = t.IsEnabled,
        CreatedAt  = t.CreatedAt,
    };

    private object? ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonDocument.Parse(json).RootElement; }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Malformed stored tool config JSON; returning null.");
            return null;
        }
    }

    private static string? SerializeJson(object? value)
    {
        if (value is null) return null;
        return value is string s ? s : JsonSerializer.Serialize(value);
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
