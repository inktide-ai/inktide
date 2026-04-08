using System.Security.Claims;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chimera.API.Soul.REST.Controllers;

/// <summary>
/// Background scene image uploads for the studio preview — direct-to-MinIO via presigned PUT.
/// </summary>
[ApiController]
[Route("api/soul/cards/{cardId:guid}/scenes")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardScenesController : ControllerBase
{
    #region Fields

    private readonly IAiCardSceneUploadService _scenes;

    #endregion

    #region Constructors

    public AiCardScenesController(IAiCardSceneUploadService scenes)
    {
        _scenes = scenes ?? throw new ArgumentNullException(nameof(scenes));
    }

    #endregion

    #region Public Methods

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardSceneResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid cardId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var list = await _scenes.ListAsync(userId, cardId, ct).ConfigureAwait(false);
        if (list is null)
            return NotFound();

        return Ok(list.Select(ToResponse).ToList());
    }

    /// <summary>Step 1: get presigned PUT URL and storage_key.</summary>
    [HttpPost("presign")]
    [ProducesResponseType(typeof(BeginSceneUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Presign(Guid cardId, [FromBody] BeginSceneUploadRequest? body, CancellationToken ct)
    {
        if (body is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _scenes
            .BeginUploadAsync(userId, cardId, body.FileName, body.ContentType, body.SizeBytes, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return Ok(new BeginSceneUploadResponse
        {
            UploadUrl = result.UploadUrl!,
            StorageKey = result.StorageKey!,
            ExpiresAt = result.ExpiresAt,
            RequiredContentType = result.RequiredContentType!
        });
    }

    /// <summary>Step 2: after PUT to MinIO, register the row in PostgreSQL.</summary>
    [HttpPost("complete")]
    [ProducesResponseType(typeof(AiCardSceneResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Complete(Guid cardId, [FromBody] CompleteSceneUploadRequest? body, CancellationToken ct)
    {
        if (body is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _scenes
            .CompleteUploadAsync(userId, cardId, body.StorageKey, body.FileName, body.ContentType, body.SizeBytes, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return Ok(ToResponse(result.Scene!));
    }

    [HttpDelete("{sceneId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Delete(Guid cardId, Guid sceneId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _scenes.DeleteAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return NoContent();
    }

    #endregion

    #region Private Methods

    private bool TryGetUserId(out Guid userId)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is not null && Guid.TryParse(sub, out userId))
            return true;

        userId = default;
        return false;
    }

    private IActionResult MapError(SceneUploadError kind, string message) => kind switch
    {
        SceneUploadError.StorageDisabled =>
            StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiErrorResponse.From(message, ErrorCodes.ServiceUnavailable)),
        SceneUploadError.CardNotFound or SceneUploadError.SceneNotFound =>
            NotFound(ApiErrorResponse.From(message, ErrorCodes.NotFound)),
        SceneUploadError.ObjectNotFoundInStorage or SceneUploadError.SizeMismatch =>
            UnprocessableEntity(ApiErrorResponse.From(message, ErrorCodes.ValidationError)),
        _ =>
            BadRequest(ApiErrorResponse.From(message, ErrorCodes.ValidationError))
    };

    private static AiCardSceneResponse ToResponse(AiCardSceneDto dto) => new()
    {
        Id = dto.Id,
        AiCardId = dto.AiCardId,
        StorageKey = dto.StorageKey,
        PublicUrl = dto.PublicUrl,
        OriginalFileName = dto.OriginalFileName,
        ContentType = dto.ContentType,
        SizeBytes = dto.SizeBytes,
        CreatedAt = dto.CreatedAt
    };

    #endregion
}
