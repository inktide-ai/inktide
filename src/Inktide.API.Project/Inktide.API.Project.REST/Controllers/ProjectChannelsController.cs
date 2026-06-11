using System.Security.Claims;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId:guid}/channels")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectChannelsController(
    IProjectCrudService projects,
    IProjectChannelService channels) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectChannelResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid projectId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var list = await channels.ListAsync(projectId, userId, ct);
        return Ok(list.Select(Map).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectChannelResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] CreateChannelRequest? body, CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.ChannelName))
            return BadRequest(new { error = "platform and channel_name are required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var channel = await channels.CreateAsync(projectId, body.Platform, body.ChannelName, ct);
        return CreatedAtAction(nameof(List), new { projectId }, Map(channel));
    }

    [HttpPatch("{channelId:guid}")]
    [ProducesResponseType(typeof(ProjectChannelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Patch(Guid projectId, Guid channelId, [FromBody] PatchChannelRequest? body, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var updated = await channels.PatchAsync(projectId, channelId, body?.IsActive, ct);
        if (updated is null) return NotFound();
        return Ok(Map(updated));
    }

    [HttpDelete("{channelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid projectId, Guid channelId, CancellationToken ct)
    {
        var userId = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var deleted = await channels.DeleteAsync(projectId, channelId, userId, ct);
        return deleted ? NoContent() : NotFound();
    }

    private static ProjectChannelResponse Map(ProjectChannel c) => new()
    {
        Id          = c.Id,
        ProjectId   = c.ProjectId,
        Platform    = c.Platform,
        ChannelName = c.ChannelName,
        ChannelId   = c.ChannelId,
        BotUsername = c.BotUsername,
        IsActive    = c.IsActive,
        ConnectedAt = c.ConnectedAt,
        CreatedAt   = c.CreatedAt,
    };

    private Guid GetUserId()
        => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
