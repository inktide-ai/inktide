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
[Route("api/v1/projects/{projectId:guid}/skills")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectSkillsController(
    IProjectCrudService projects,
    IProjectToolService tools,
    ILogger<ProjectSkillsController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ProjectSkillsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid projectId, CancellationToken ct)
    {
        var userId  = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var toolList = await tools.ListAsync(projectId, ct);

        return Ok(new ProjectSkillsResponse
        {
            SystemPrompt     = project.SystemPrompt,
            BehaviorSettings = ParseJson(project.BehaviorSettings),
            MemorySettings   = ParseJson(project.MemorySettings),
            AutoPilot        = ParseJson(project.AutoPilot),
            Tools = toolList.Select(t => new ProjectToolResponse
            {
                Id         = t.Id,
                ProjectId  = t.ProjectId,
                ToolName   = t.ToolName,
                ToolConfig = ParseJson(t.ToolConfig),
                IsEnabled  = t.IsEnabled,
                CreatedAt  = t.CreatedAt,
            }).ToList(),
        });
    }

    [HttpPut]
    [ProducesResponseType(typeof(ProjectSkillsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid projectId, [FromBody] UpdateSkillsRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var project = await projects.UpdateSkillsAsync(
            projectId, userId,
            request.SystemPrompt,
            SerializeJson(request.BehaviorSettings),
            SerializeJson(request.MemorySettings),
            SerializeJson(request.AutoPilot),
            ct);

        var toolList = await tools.ListAsync(projectId, ct);

        return Ok(new ProjectSkillsResponse
        {
            SystemPrompt     = project.SystemPrompt,
            BehaviorSettings = ParseJson(project.BehaviorSettings),
            MemorySettings   = ParseJson(project.MemorySettings),
            AutoPilot        = ParseJson(project.AutoPilot),
            Tools = toolList.Select(t => new ProjectToolResponse
            {
                Id         = t.Id,
                ProjectId  = t.ProjectId,
                ToolName   = t.ToolName,
                ToolConfig = ParseJson(t.ToolConfig),
                IsEnabled  = t.IsEnabled,
                CreatedAt  = t.CreatedAt,
            }).ToList(),
        });
    }

    [HttpDelete("system-prompt")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetSystemPrompt(Guid projectId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try { await projects.ResetSystemPromptAsync(projectId, userId, ct); }
        catch (KeyNotFoundException) { return NotFound(); }
        return NoContent();
    }

    private object? ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonDocument.Parse(json).RootElement; }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Malformed stored project JSON config; returning null.");
            return null;
        }
    }

    private static string? SerializeJson(object? value)
    {
        if (value is null) return null;
        return value is string s ? s : JsonSerializer.Serialize(value);
    }
}
