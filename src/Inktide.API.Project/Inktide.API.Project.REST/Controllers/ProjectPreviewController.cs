using System.Security.Claims;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Storage;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId:guid}/preview")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectPreviewController(
    IProjectCrudService projects,
    IObjectStorageService storage,
    ObjectStorageSettings s3) : ControllerBase
{
    private static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);

    [HttpPost("presign")]
    [ProducesResponseType(typeof(ProjectPreviewPresignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Presign(Guid projectId, CancellationToken ct)
    {
        if (!storage.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Object storage not configured." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var objectKey = $"previews/{userId:N}/{projectId:N}.webp";
        var uploadUrl = storage.GetPreSignedPutUrl(objectKey, "image/webp", PresignTtl);
        if (string.IsNullOrEmpty(uploadUrl))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Could not create upload URL." });

        var publicUrl = ObjectStoragePublicUrl.Build(s3.ServiceUrl, s3.PublicBaseUrl, s3.DefaultBucket, objectKey);
        return Ok(new ProjectPreviewPresignResponse { UploadUrl = uploadUrl, PublicUrl = publicUrl });
    }

    [HttpPost("complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Complete(Guid projectId, [FromBody] CompleteProjectPreviewRequest? body, CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.PublicUrl))
            return BadRequest(new { error = "public_url is required." });

        var userId  = GetUserId();
        var project = await projects.GetAsync(projectId, userId, ct);
        if (project is null) return NotFound();

        var expectedKey = $"previews/{userId:N}/{projectId:N}.webp";
        var expectedUrl = ObjectStoragePublicUrl.Build(s3.ServiceUrl, s3.PublicBaseUrl, s3.DefaultBucket, expectedKey);
        if (!string.Equals(body.PublicUrl.TrimEnd('/'), expectedUrl.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Invalid preview URL." });

        await projects.SetPreviewUrlAsync(projectId, userId, body.PublicUrl, ct);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}
