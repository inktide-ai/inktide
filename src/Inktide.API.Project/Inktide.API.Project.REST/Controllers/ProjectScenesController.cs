using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.REST.Models;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId:guid}/scenes")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectScenesController(
    IProjectCrudService projects,
    IProjectSceneService scenes) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectSceneResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid projectId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var list = await scenes.ListAsync(projectId, ct);
        return Ok(list.Select(s => MapScene(s, project.ActiveSceneId)).ToList());
    }

    [HttpPost("presign")]
    [ProducesResponseType(typeof(SceneUploadPresignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Presign(Guid projectId, [FromBody] SceneUploadPresignRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(new { error = "Request body required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        try
        {
            var result = await scenes.PresignAsync(projectId, userId, body.FileName, body.ContentType, body.SizeBytes, ct);
            return Ok(new SceneUploadPresignResponse
            {
                UploadUrl           = result.UploadUrl,
                StorageKey          = result.StorageKey,
                ExpiresAt           = result.ExpiresAt,
                RequiredContentType = result.RequiredContentType,
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not configured"))
        {
            return StatusCode(503, new { error = ex.Message });
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("complete")]
    [ProducesResponseType(typeof(ProjectSceneResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Complete(Guid projectId, [FromBody] SceneUploadCompleteRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(new { error = "Request body required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        try
        {
            var command = new CompleteSceneUploadCommand(body.StorageKey, body.FileName, body.ContentType, body.SizeBytes, body.DisplayName);
            var saved   = await scenes.CompleteUploadAsync(projectId, userId, command, ct);
            return Ok(MapScene(saved, project.ActiveSceneId));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not configured"))
        {
            return StatusCode(503, new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found in storage"))
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{sceneId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Patch(Guid projectId, Guid sceneId, [FromBody] PatchSceneRequest request, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var scene = await scenes.GetByIdAsync(sceneId, ct);
        if (scene is null || scene.ProjectId != projectId) return NotFound();

        if (request.Active.HasValue)
        {
            if (request.Active.Value)
                await projects.SetActiveSceneAsync(projectId, userId, sceneId, ct);
            else if (project.ActiveSceneId == sceneId)
                await projects.SetActiveSceneAsync(projectId, userId, null, ct);
        }
        return NoContent();
    }

    [HttpPatch("{sceneId:guid}/position")]
    [ProducesResponseType(typeof(ProjectSceneResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(Guid projectId, Guid sceneId, [FromBody] ReorderSceneRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(new { error = "Request body required." });
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var scene = await scenes.GetByIdAsync(sceneId, ct);
        if (scene is null || scene.ProjectId != projectId) return NotFound();

        await scenes.ReorderAsync(sceneId, body.PreviousId, body.NextId, ct);
        var updated = await scenes.GetByIdAsync(sceneId, ct);
        return Ok(MapScene(updated!, project.ActiveSceneId));
    }

    [HttpDelete("{sceneId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid projectId, Guid sceneId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var scene = await scenes.GetByIdAsync(sceneId, ct);
        if (scene is null || scene.ProjectId != projectId) return NotFound();

        await scenes.DeleteAsync(projectId, sceneId, userId, ct);
        return NoContent();
    }

    private static ProjectSceneResponse MapScene(ProjectScene s, Guid? activeSceneId) => new()
    {
        Id           = s.Id,
        ProjectId    = s.ProjectId,
        StorageKey   = s.StorageKey,
        PublicUrl    = s.PublicUrl,
        OriginalName = s.OriginalName ?? string.Empty,
        ContentType  = s.ContentType  ?? string.Empty,
        SizeBytes    = s.SizeBytes,
        DisplayName  = s.DisplayName,
        Description  = s.Description,
        SortKey      = s.SortKey,
        CreatedAt    = s.CreatedAt,
        IsActive     = s.Id == activeSceneId,
    };

    private Guid GetUserId()
        => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

public sealed class SceneUploadPresignRequest
{
    [JsonProperty("file_name")]    public string FileName    { get; set; } = string.Empty;
    [JsonProperty("content_type")] public string ContentType { get; set; } = string.Empty;
    [JsonProperty("size_bytes")]   public long   SizeBytes   { get; set; }
}

public sealed class SceneUploadPresignResponse
{
    [JsonProperty("upload_url")]            public string         UploadUrl           { get; set; } = string.Empty;
    [JsonProperty("storage_key")]           public string         StorageKey          { get; set; } = string.Empty;
    [JsonProperty("expires_at")]            public DateTimeOffset ExpiresAt           { get; set; }
    [JsonProperty("required_content_type")] public string         RequiredContentType { get; set; } = string.Empty;
}

public sealed class SceneUploadCompleteRequest
{
    [JsonProperty("storage_key")]   public string  StorageKey   { get; set; } = string.Empty;
    [JsonProperty("file_name")]     public string  FileName     { get; set; } = string.Empty;
    [JsonProperty("content_type")]  public string  ContentType  { get; set; } = string.Empty;
    [JsonProperty("size_bytes")]    public long    SizeBytes    { get; set; }
    [JsonProperty("display_name")]  public string? DisplayName  { get; set; }
}

public sealed class ReorderSceneRequest
{
    [JsonProperty("previous_id")] public Guid? PreviousId { get; set; }
    [JsonProperty("next_id")]     public Guid? NextId     { get; set; }
}

public sealed record PatchSceneRequest(bool? Active, int? Position);
