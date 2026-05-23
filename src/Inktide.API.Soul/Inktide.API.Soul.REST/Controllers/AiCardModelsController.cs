using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// Direct-to-MinIO uploads via presigned PUT, then persistence in PostgreSQL.
/// </summary>
[ApiController]
[Route("api/soul/cards/{cardId:guid}/models")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardModelsController : ApiController
{

    private readonly IAiCardModelUploadService _uploads;


    public AiCardModelsController(IAiCardModelUploadService uploads)
    {
        _uploads = uploads ?? throw new ArgumentNullException(nameof(uploads));
    }


    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardModelResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid cardId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var list = await _uploads.ListAsync(userId, cardId, ct).ConfigureAwait(false);
        if (list is null)
            return NotFound();

        return Ok(list.Select(ToResponse).ToList());
    }

    /// <summary>Step 1: get presigned PUT URL and storage_key.</summary>
    [HttpPost("presign")]
    [ProducesResponseType(typeof(BeginModelUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Presign(Guid cardId, [FromBody] BeginModelUploadRequest? body, CancellationToken ct)
    {
        if (body is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _uploads
            .BeginUploadAsync(userId, cardId, body.FileName, body.ContentType, body.SizeBytes, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return Ok(new BeginModelUploadResponse
        {
            UploadUrl = result.UploadUrl!,
            StorageKey = result.StorageKey!,
            ExpiresAt = result.ExpiresAt,
            RequiredContentType = result.RequiredContentType!
        });
    }

    /// <summary>Step 2: after PUT to MinIO, register the row in PostgreSQL.</summary>
    [HttpPost("complete")]
    [ProducesResponseType(typeof(AiCardModelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Complete(Guid cardId, [FromBody] CompleteModelUploadRequest? body, CancellationToken ct)
    {
        if (body is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _uploads
            .CompleteUploadAsync(userId, cardId, body.StorageKey, body.FileName, body.ContentType, body.SizeBytes, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return Ok(ToResponse(result.Model!));
    }

    [HttpDelete("{modelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Delete(Guid cardId, Guid modelId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _uploads.DeleteAsync(userId, cardId, modelId, ct).ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return NoContent();
    }

    [HttpPatch("{modelId:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid cardId, Guid modelId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _uploads.SetActiveAsync(userId, cardId, modelId, ct).ConfigureAwait(false);

        if (!result.Success)
            return MapError(result.ErrorKind, result.Error!);

        return NoContent();
    }


    private IActionResult MapError(ModelUploadError kind, string message) => kind switch
    {
        ModelUploadError.StorageDisabled =>
            StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiErrorResponse.From(message, ErrorCodes.ServiceUnavailable)),
        ModelUploadError.CardNotFound or ModelUploadError.ModelNotFound =>
            NotFound(ApiErrorResponse.From(message, ErrorCodes.NotFound)),
        ModelUploadError.ObjectNotFoundInStorage or ModelUploadError.SizeMismatch =>
            UnprocessableEntity(ApiErrorResponse.From(message, ErrorCodes.ValidationError)),
        _ =>
            BadRequest(ApiErrorResponse.From(message, ErrorCodes.ValidationError))
    };

    private static AiCardModelResponse ToResponse(AiCardModel dto)
    {
        return new AiCardModelResponse
        {
            Id = dto.Id,
            AiCardId = dto.AiCardId,
            StorageKey = dto.StorageKey,
            PublicUrl = dto.PublicUrl,
            OriginalFileName = dto.OriginalFileName,
            ContentType = dto.ContentType,
            SizeBytes = dto.SizeBytes,
            CreatedAt = dto.CreatedAt,
            IsActive = dto.IsActive,
        };
    }

}
