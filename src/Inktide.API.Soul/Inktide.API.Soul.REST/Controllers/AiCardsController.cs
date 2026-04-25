using System.Security.Claims;
using Inktide.API.Soul.Application.Exceptions;
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
public sealed class AiCardsController : ControllerBase
{
    private const long MaxAvatarUploadBytes = 52_428_800;

    private readonly IAiCardService _cardService;
    private readonly IAiCardAvatarService _cardAvatar;
    private readonly IAiCardBannerService _cardBanner;
    private readonly IAiCardActivityService _activity;

    public AiCardsController(
        IAiCardService cardService,
        IAiCardAvatarService cardAvatar,
        IAiCardBannerService cardBanner,
        IAiCardActivityService activity)
    {
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
        _cardAvatar  = cardAvatar  ?? throw new ArgumentNullException(nameof(cardAvatar));
        _cardBanner  = cardBanner  ?? throw new ArgumentNullException(nameof(cardBanner));
        _activity    = activity    ?? throw new ArgumentNullException(nameof(activity));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var userId = GetUserId();
        var cards  = await _cardService.GetAllByUserAsync(userId, ct);
        return Ok(cards.Select(AiCardResponseMapper.ToListItem).ToList());
    }

    [HttpGet("{cardId:guid}")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid cardId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        var card   = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        return Ok(AiCardResponseMapper.ToResponse(card));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateAiCardRequest? request, CancellationToken ct = default)
    {
        if (request is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        var userId  = GetUserId();
        var entity  = AiCardEntityFactory.ToEntity(request);
        var created = await _cardService.CreateAsync(userId, entity, ct);
        return CreatedAtAction(nameof(GetById), new { cardId = created.Id }, AiCardResponseMapper.ToResponse(created));
    }

    [HttpPut("{cardId:guid}")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid cardId, [FromBody] UpdateAiCardRequest? request, CancellationToken ct = default)
    {
        if (request is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        try
        {
            var userId   = GetUserId();
            var existing = await _cardService.GetByIdAsync(userId, cardId, ct);
            if (existing is null)
                return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));

            AiCardEntityFactory.ApplyUpdate(existing, request);
            var updated = await _cardService.UpdateAsync(userId, existing, ct);
            return Ok(AiCardResponseMapper.ToResponse(updated));
        }
        catch (AiCardNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        }
        catch (SlugAlreadyExistsException ex)
        {
            return Conflict(ApiErrorResponse.From(ex.Message, ErrorCodes.SlugConflict));
        }
    }

    [HttpDelete("{cardId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid cardId, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            await _cardService.DeleteAsync(userId, cardId, ct);
            return NoContent();
        }
        catch (AiCardNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        }
    }

    /// <summary>Upload an image to S3 and set the card's avatar URL.</summary>
    [HttpPost("{cardId:guid}/avatar")]
    [RequestSizeLimit(MaxAvatarUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAvatarUploadBytes)]
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
        {
            if (string.Equals(result.Error, "AI card not found.", StringComparison.Ordinal))
                return NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound));
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiErrorResponse.From(result.Error!, ErrorCodes.ServiceUnavailable));
        }

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }

    /// <summary>Upload an image to S3 and set the card's banner image URL.</summary>
    [HttpPost("{cardId:guid}/banner")]
    [RequestSizeLimit(MaxAvatarUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAvatarUploadBytes)]
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
        {
            if (string.Equals(result.Error, "AI card not found.", StringComparison.Ordinal))
                return NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound));
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiErrorResponse.From(result.Error!, ErrorCodes.ServiceUnavailable));
        }

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }

    /// <summary>Remove the card's banner image, reverting to the colour gradient.</summary>
    [HttpDelete("{cardId:guid}/banner")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveBanner(Guid cardId, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _cardBanner.RemoveBannerAsync(userId, cardId, ct).ConfigureAwait(false);

        if (!result.Success)
            return NotFound(ApiErrorResponse.From(result.Error!, ErrorCodes.NotFound));

        return Ok(AiCardResponseMapper.ToResponse(result.Card!));
    }

    [HttpGet("{cardId:guid}/activity")]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardActivityItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActivity(Guid cardId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        var card   = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));

        var entries = await _activity.GetRecentAsync("ai_card", cardId, limit: 20, ct);
        var items   = entries.Select(e => new AiCardActivityItem
        {
            Id        = e.Id,
            Action    = e.Action,
            CreatedAt = e.CreatedAt,
        }).ToList();

        return Ok(items);
    }


    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}
