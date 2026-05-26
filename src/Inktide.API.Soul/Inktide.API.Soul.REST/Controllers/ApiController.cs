using System.Security.Claims;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>Shared HTTP error categories for upload result mapping.</summary>
public enum UploadErrorCategory { StorageDisabled, NotFound, Unprocessable, BadRequest }

[ApiController]
public abstract class ApiController : ControllerBase
{
    protected bool TryGetUserId(out Guid userId)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is not null && Guid.TryParse(sub, out userId))
            return true;

        userId = default;
        return false;
    }

    protected Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return userId;
    }

    protected IActionResult MapUploadError<TError>(TError kind, string message) where TError : struct, Enum
    {
        var category = kind.ToString() switch
        {
            "StorageDisabled"                                           => UploadErrorCategory.StorageDisabled,
            "CardNotFound" or "ModelNotFound" or "SceneNotFound"       => UploadErrorCategory.NotFound,
            "ObjectNotFoundInStorage" or "SizeMismatch"                => UploadErrorCategory.Unprocessable,
            _                                                           => UploadErrorCategory.BadRequest,
        };
        return MapUploadError(category, message);
    }

    protected IActionResult MapUploadError(UploadErrorCategory category, string message) => category switch
    {
        UploadErrorCategory.StorageDisabled =>
            StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiErrorResponse.From(message, ErrorCodes.ServiceUnavailable)),
        UploadErrorCategory.NotFound =>
            NotFound(ApiErrorResponse.From(message, ErrorCodes.NotFound)),
        UploadErrorCategory.Unprocessable =>
            UnprocessableEntity(ApiErrorResponse.From(message, ErrorCodes.ValidationError)),
        _ =>
            BadRequest(ApiErrorResponse.From(message, ErrorCodes.ValidationError)),
    };
}
