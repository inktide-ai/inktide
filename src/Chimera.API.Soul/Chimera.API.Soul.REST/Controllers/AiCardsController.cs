using System.Security.Claims;
using Chimera.API.Soul.Application.Exceptions;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.REST.Converters;
using Chimera.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chimera.API.Soul.REST.Controllers;

[ApiController]
[Route("api/soul/cards")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardsController : ControllerBase
{
    #region Fields

    private readonly IAiCardService _cardService;

    #endregion

    #region Constructors

    public AiCardsController(IAiCardService cardService)
    {
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
    }

    #endregion

    #region Public Methods

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var userId = GetUserId();
        var cards = await _cardService.GetAllByUserAsync(userId, ct);
        return Ok(cards.Select(AiCardConverter.ToListItem).ToList());
    }

    [HttpGet("{cardId:guid}")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid cardId, CancellationToken ct)
    {
        var userId = GetUserId();
        var card = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        return Ok(AiCardConverter.ToResponse(card));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateAiCardRequest? request, CancellationToken ct)
    {
        if (request is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        var userId = GetUserId();
        var entity = AiCardConverter.ToEntity(request);
        var created = await _cardService.CreateAsync(userId, entity, ct);
        return CreatedAtAction(nameof(GetById), new { cardId = created.Id }, AiCardConverter.ToResponse(created));
    }

    [HttpPut("{cardId:guid}")]
    [ProducesResponseType(typeof(AiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid cardId, [FromBody] UpdateAiCardRequest? request, CancellationToken ct)
    {
        if (request is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        try
        {
            var userId = GetUserId();
            var existing = await _cardService.GetByIdAsync(userId, cardId, ct);
            if (existing is null)
                return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));

            AiCardConverter.ApplyUpdate(existing, request);
            var updated = await _cardService.UpdateAsync(userId, existing, ct);
            return Ok(AiCardConverter.ToResponse(updated));
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

    #endregion

    #region Private Methods

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

    #endregion
}
