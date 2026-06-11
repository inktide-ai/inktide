using System.Security.Claims;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId:guid}/run-presets")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectRunPresetsController(
    IProjectCrudService projects,
    IProjectRunPresetService presets) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectRunPresetResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid projectId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var list = await presets.ListAsync(projectId, ct);
        return Ok(list.Select(Map).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectRunPresetResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] UpsertRunPresetRequest? body, CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { error = "name is required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var preset = await presets.CreateAsync(projectId, body.Name, body.Description, body.Icon,
            body.OverrideLlmModelId, body.OverrideTemperature,
            body.OverrideEmotionPresetId, body.OverrideVoiceProfileId, ct);
        return CreatedAtAction(nameof(List), new { projectId }, Map(preset));
    }

    [HttpPut("{presetId:guid}")]
    [ProducesResponseType(typeof(ProjectRunPresetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid projectId, Guid presetId, [FromBody] UpsertRunPresetRequest? body, CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { error = "name is required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var updated = await presets.UpdateAsync(projectId, presetId, body.Name, body.Description, body.Icon,
            body.OverrideLlmModelId, body.OverrideTemperature,
            body.OverrideEmotionPresetId, body.OverrideVoiceProfileId, ct);
        if (updated is null) return NotFound();
        return Ok(Map(updated));
    }

    [HttpPost("{presetId:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid projectId, Guid presetId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();
        await presets.ActivateAsync(projectId, presetId, ct);
        return NoContent();
    }

    [HttpPost("{presetId:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid projectId, Guid presetId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();
        await presets.DeactivateAsync(projectId, presetId, ct);
        return NoContent();
    }

    [HttpDelete("{presetId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid projectId, Guid presetId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();
        var deleted = await presets.DeleteAsync(projectId, presetId, ct);
        return deleted ? NoContent() : NotFound();
    }

    private static ProjectRunPresetResponse Map(ProjectRunPreset p) => new()
    {
        Id                      = p.Id,
        ProjectId               = p.ProjectId,
        Name                    = p.Name,
        Description             = p.Description,
        Icon                    = p.Icon,
        IsActive                = p.IsActive,
        OverrideLlmModelId      = p.OverrideLlmModelId,
        OverrideTemperature     = p.OverrideTemperature,
        OverrideEmotionPresetId = p.OverrideEmotionPresetId,
        OverrideVoiceProfileId  = p.OverrideVoiceProfileId,
        SortKey                 = p.SortKey,
        CreatedAt               = p.CreatedAt,
        UpdatedAt               = p.UpdatedAt,
    };

    private Guid GetUserId()
        => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
