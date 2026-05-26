using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Mappers;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

[ApiController]
[Route("api/soul/cards")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardAssetsController : ApiController
{
    private const long MaxUploadBytes = 52_428_800L;

    private readonly IAiCardAvatarService _cardAvatar;
    private readonly IAiCardBannerService _cardBanner;

    public AiCardAssetsController(
        IAiCardAvatarService cardAvatar,
        IAiCardBannerService cardBanner)
    {
        _cardAvatar = cardAvatar ?? throw new ArgumentNullException(nameof(cardAvatar));
        _cardBanner = cardBanner ?? throw new ArgumentNullException(nameof(cardBanner));
    }

    [HttpPost("{cardId:guid}/avatar")]
    [RequestSizeLimit(MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes)]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> UploadAvatar(Guid cardId, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiErrorResponse.From("Image file is required.", ErrorCodes.ValidationError));

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiErrorResponse.From("File must be an image.", ErrorCodes.ValidationError));

        var userId = GetUserId();
        await using var stream = file.OpenReadStream();
        var result = await _cardAvatar
            .UploadAvatarAsync(userId, cardId, stream, file.FileName, file.ContentType, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return result.ErrorKind switch
            {
                AiCardAvatarError.CardNotFound      => NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound)),
                AiCardAvatarError.StorageUnavailable => StatusCode(StatusCodes.Status503ServiceUnavailable,
                    ApiErrorResponse.From(result.Error!, ErrorCodes.ServiceUnavailable)),
                _ => BadRequest(ApiErrorResponse.From(result.Error!, ErrorCodes.ValidationError))
            };

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }

    [HttpPost("{cardId:guid}/banner")]
    [RequestSizeLimit(MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes)]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadBanner(Guid cardId, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiErrorResponse.From("Image file is required.", ErrorCodes.ValidationError));

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiErrorResponse.From("File must be an image.", ErrorCodes.ValidationError));

        var userId = GetUserId();
        await using var stream = file.OpenReadStream();
        var result = await _cardBanner
            .UploadBannerAsync(userId, cardId, stream, file.FileName, file.ContentType, ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return result.ErrorKind switch
            {
                AiCardBannerError.CardNotFound       => NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound)),
                AiCardBannerError.StorageUnavailable  => StatusCode(StatusCodes.Status503ServiceUnavailable,
                    ApiErrorResponse.From(result.Error!, ErrorCodes.ServiceUnavailable)),
                _ => BadRequest(ApiErrorResponse.From(result.Error!, ErrorCodes.ValidationError))
            };

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }

    [HttpDelete("{cardId:guid}/banner")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveBanner(Guid cardId, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _cardBanner.RemoveBannerAsync(userId, cardId, ct).ConfigureAwait(false);

        if (!result.Success)
            return result.ErrorKind switch
            {
                AiCardBannerError.CardNotFound => NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound)),
                _ => StatusCode(StatusCodes.Status503ServiceUnavailable,
                    ApiErrorResponse.From(result.Error!, ErrorCodes.ServiceUnavailable))
            };

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }
}
