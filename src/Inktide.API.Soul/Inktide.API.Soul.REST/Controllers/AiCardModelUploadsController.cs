using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.REST.Mappers;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// Resumable model uploads in small chunks through the API. Survives connections that drop
/// part way (the presigned flow needs the whole file in one request).
/// </summary>
[ApiController]
[Route("api/v1/souls/cards/{cardId:guid}/models/uploads")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardModelUploadsController : ApiController
{
    private readonly IChunkedModelUploadService _chunked;

    public AiCardModelUploadsController(IChunkedModelUploadService chunked)
    {
        _chunked = chunked ?? throw new ArgumentNullException(nameof(chunked));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ModelUploadSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Start(Guid cardId, [FromBody] StartModelUploadRequest? body, CancellationToken ct)
    {
        if (body is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _chunked.StartAsync(userId, cardId, body.FileName, body.SizeBytes, ct).ConfigureAwait(false);
        return result.Success ? Ok(ToResponse(result.Upload!)) : MapError(result.ErrorKind, result.Error!);
    }

    /// <summary>How much the server holds, for resuming after a reload or a dropped chunk.</summary>
    [HttpGet("{uploadId:guid}")]
    [ProducesResponseType(typeof(ModelUploadSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Status(Guid cardId, Guid uploadId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _chunked.GetStatusAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        return result.Success ? Ok(ToResponse(result.Upload!)) : MapError(result.ErrorKind, result.Error!);
    }

    /// <summary>Raw bytes of the file starting at <paramref name="offset"/>.</summary>
    [HttpPut("{uploadId:guid}")]
    [RequestSizeLimit(ChunkedUploadLimits.MaxChunkBytes)]
    [ProducesResponseType(typeof(ModelUploadChunkResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ModelUploadConflictResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> PutChunk(Guid cardId, Guid uploadId, [FromQuery] long? offset, CancellationToken ct)
    {
        if (offset is null)
            return BadRequest(ApiErrorResponse.From("offset is required.", ErrorCodes.ValidationError));

        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _chunked
            .AppendAsync(userId, cardId, uploadId, offset.Value, Request.Body, ct)
            .ConfigureAwait(false);
        return result.Success
            ? Ok(new ModelUploadChunkResponse(result.ReceivedBytes))
            : MapError(result.ErrorKind, result.Error!, result.ReceivedBytes);
    }

    [HttpPost("{uploadId:guid}/complete")]
    [ProducesResponseType(typeof(AiCardModelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ModelUploadConflictResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Complete(Guid cardId, Guid uploadId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var result = await _chunked.CompleteAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        return result.Success
            ? Ok(AiCardModelResponseMapper.ToResponse(result.Model!))
            : MapError(result.ErrorKind, result.Error!, result.ReceivedBytes);
    }

    [HttpDelete("{uploadId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid cardId, Guid uploadId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await _chunked.CancelAsync(userId, cardId, uploadId, ct).ConfigureAwait(false)
            ? NoContent()
            : MapError(ChunkedUploadError.UploadNotFound, "Upload not found.");
    }

    private static ModelUploadSessionResponse ToResponse(ChunkedUploadInfo u) =>
        new(u.UploadId, u.SizeBytes, u.ReceivedBytes, u.ChunkBytes);

    private IActionResult MapError(ChunkedUploadError kind, string message, long receivedBytes = 0)
    {
        switch (kind)
        {
            case ChunkedUploadError.OffsetMismatch:
                return Conflict(new ModelUploadConflictResponse(receivedBytes, message, "OFFSET_MISMATCH"));
            case ChunkedUploadError.Incomplete:
                return Conflict(new ModelUploadConflictResponse(receivedBytes, message, "UPLOAD_INCOMPLETE"));
            case ChunkedUploadError.Busy:
                Response.Headers.RetryAfter = "2";
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    ApiErrorResponse.From(message, ErrorCodes.ServiceUnavailable));
            case ChunkedUploadError.UploadNotFound:
            case ChunkedUploadError.CardNotFound:
                return MapUploadError(UploadErrorCategory.NotFound, message);
            case ChunkedUploadError.StorageDisabled:
                return MapUploadError(UploadErrorCategory.StorageDisabled, message);
            case ChunkedUploadError.InvalidFile:
                return MapUploadError(UploadErrorCategory.Unprocessable, message);
            default:
                return MapUploadError(UploadErrorCategory.BadRequest, message);
        }
    }
}
