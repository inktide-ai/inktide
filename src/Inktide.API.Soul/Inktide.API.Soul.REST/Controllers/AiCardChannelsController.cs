using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.REST.Converters;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

[ApiController]
[Route("api/soul/cards/{cardId:guid}/channels")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardChannelsController : ApiController
{

    private readonly IAiCardChannelCrudService _channelLinks;

    public AiCardChannelsController(IAiCardChannelCrudService channelLinks)
    {
        _channelLinks = channelLinks ?? throw new ArgumentNullException(nameof(channelLinks));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ChannelResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid cardId,
        [FromBody] CreateChannelRequest? request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var userId = GetUserId();
        var cmd = new CreateChannelLinkCommand(
            request.Platform,
            request.ChannelName,
            request.ChannelId,
            request.BotUsername);

        try
        {
            var created = await _channelLinks.CreateAsync(userId, cardId, cmd, ct);
            var response = AiCardConverter.ToChannelResponse(created);
            return Created(string.Empty, response);
        }
        catch (AiCardNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        }
        catch (ChannelLinkConflictException ex)
        {
            return Conflict(ApiErrorResponse.From(ex.Message, ErrorCodes.ValidationError));
        }
    }

    [HttpPatch("{linkId:guid}")]
    [ProducesResponseType(typeof(ChannelResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Patch(
        Guid cardId,
        Guid linkId,
        [FromBody] PatchChannelRequest? request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var userId = GetUserId();
        try
        {
            var updated = await _channelLinks.PatchAsync(
                userId,
                cardId,
                linkId,
                new PatchChannelLinkCommand(request.IsActive),
                ct);
            return Ok(AiCardConverter.ToChannelResponse(updated));
        }
        catch (AiCardNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        }
        catch (ChannelLinkNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("Channel link not found.", ErrorCodes.NotFound));
        }
    }

    [HttpDelete("{linkId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid cardId, Guid linkId, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            await _channelLinks.DeleteAsync(userId, cardId, linkId, ct);
            return NoContent();
        }
        catch (AiCardNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("AI card not found.", ErrorCodes.NotFound));
        }
        catch (ChannelLinkNotFoundException)
        {
            return NotFound(ApiErrorResponse.From("Channel link not found.", ErrorCodes.NotFound));
        }
    }


}
