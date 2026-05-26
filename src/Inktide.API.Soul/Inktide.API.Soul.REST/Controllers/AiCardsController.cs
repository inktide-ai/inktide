using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Enums;
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
public sealed class AiCardsController : ApiController
{
    private readonly IAiCardService _cardService;
    private readonly IAiCardActivityService _activity;
    private readonly IAiCardExportService _exportService;

    public AiCardsController(
        IAiCardService cardService,
        IAiCardActivityService activity,
        IAiCardExportService exportService)
    {
        _cardService   = cardService   ?? throw new ArgumentNullException(nameof(cardService));
        _activity      = activity      ?? throw new ArgumentNullException(nameof(activity));
        _exportService = exportService ?? throw new ArgumentNullException(nameof(exportService));
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

        var userId = GetUserId();

        try
        {
            var entity  = AiCardEntityFactory.ToEntity(request);
            var created = await _cardService.CreateAsync(userId, entity, request.LlmConfig?.ProviderId, ct);
            return CreatedAtAction(nameof(GetById), new { cardId = created.Id }, AiCardResponseMapper.ToResponse(created));
        }
        catch (PlanLimitExceededException ex)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired,
                ApiErrorResponse.From(ex.Message, "PLAN_LIMIT_EXCEEDED"));
        }
        catch (SoulCreationException ex)
        {
            return BadRequest(ApiErrorResponse.FromGuard(ex.ErrorCode, ex.Message, ex.Field));
        }
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

    [HttpGet("{cardId:guid}/activity")]
    [ProducesResponseType(typeof(IReadOnlyList<AiCardActivityItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActivity(Guid cardId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        var card   = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));

        var entries = await _activity.GetRecentAsync(userId, "ai_card", cardId, limit: 20, ct);
        var items   = entries.Select(e => new AiCardActivityItem
        {
            Id        = e.Id,
            Action    = e.Action,
            CreatedAt = e.CreatedAt,
        }).ToList();

        return Ok(items);
    }


    /// <summary>
    /// Exports the full project (soul + graph) as a .inkt file download.
    /// </summary>
    [HttpGet("{cardId:guid}/export")]
    [ProducesResponseType(typeof(InktProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Export(Guid cardId, CancellationToken ct = default)
    {
        var result = await _exportService.ExportAsync(GetUserId(), cardId, ct);
        if (result is null)
            return NotFound(ApiErrorResponse.From("Project not found.", ErrorCodes.NotFound));

        return File(result.Content, result.ContentType, result.FileName);
    }

    /// <summary>Change the run status of a soul card: start, pause, or stop.</summary>
    [HttpPatch("{cardId:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeStatus(
        Guid cardId, [FromBody] ChangeCardStatusRequest? request, CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Action))
            return BadRequest(ApiErrorResponse.From("action is required.", ErrorCodes.ValidationError));

        var (isActive, status) = request.Action.ToLowerInvariant() switch
        {
            "start" => (true,  AiCardStatus.Active),
            "pause" => (true,  AiCardStatus.Paused),
            "stop"  => (false, AiCardStatus.Stopped),
            _       => ((bool?)null, (AiCardStatus?)null)
        };

        if (isActive is null || status is null)
            return BadRequest(ApiErrorResponse.From("action must be 'start', 'pause', or 'stop'.", ErrorCodes.ValidationError));

        var userId = GetUserId();
        var card   = await _cardService.ChangeStatusAsync(userId, cardId, isActive.Value, status.Value, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));

        return NoContent();
    }

    /// <summary>Move a soul to a new position. previousId=null → beginning; nextId=null → end.</summary>
    [HttpPut("{cardId:guid}/position")]
    [ProducesResponseType(typeof(AiCardListItem), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(
        Guid cardId, [FromBody] ReorderCardRequest? body, CancellationToken ct = default)
    {
        if (body is null) return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        var userId = GetUserId();

        var card = await _cardService.ReorderAsync(userId, cardId, body.PreviousId, body.NextId, ct).ConfigureAwait(false);
        if (card is null) return NotFound(ApiErrorResponse.From("Soul not found.", ErrorCodes.NotFound));

        return Ok(AiCardResponseMapper.ToListItem(card));
    }

}
