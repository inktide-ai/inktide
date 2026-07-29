using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Core.Controllers;
using Inktide.API.Connector.InktideChat.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.InktideChat;

[ApiController]
[Route("api/v1/connectors/inktide")]
[Authorize]
public sealed class InktideChatSendController : ConnectorControllerBase
{
    private readonly IInktideChatInbox _inbox;
    private readonly ILogger<InktideChatSendController> _logger;

    public InktideChatSendController(
        IInktideChatInbox inbox,
        ILogger<InktideChatSendController> logger)
    {
        _inbox = inbox ?? throw new ArgumentNullException(nameof(inbox));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Enqueues a browser chat message for the Synapse pipeline.
    /// <c>channelId</c> must be <c>"{cardId}:{userId}"</c> where <c>userId</c> matches
    /// the authenticated principal - enforced server-side to prevent channel hijacking.
    /// </summary>
    [HttpPost("messages")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public IActionResult Send([FromBody] InktideChatSendRequest request)
    {
        var userId = GetUserId().ToString();
        var belongs = InktideChatChannelId.BelongsToUser(request.ChannelId, userId);

        if (!belongs)
            return BadRequest(ApiErrorResponse.From("channelId must be in the format '{cardId}:{userId}' where userId matches the authenticated user.", "VALIDATION_ERROR"));

        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(ApiErrorResponse.From("Text must not be empty or whitespace-only.", "VALIDATION_ERROR"));

        var userName = User.FindFirstValue("preferred_username")
                       ?? User.FindFirstValue(ClaimTypes.Name)
                       ?? userId;

        _logger.LogDebug(
            "[InktideChat] Incoming message. Channel={ChannelId} User={UserName} Chars={Chars}",
            request.ChannelId, userName, request.Text.Length);

        if (!_inbox.TryEnqueue(request.ChannelId, userId, userName, request.Text))
        {
            _logger.LogWarning(
                "[InktideChat] Inbox full — returning 429. Channel={ChannelId} User={UserName}",
                request.ChannelId, userName);

            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Inbox is currently full. Please try again shortly." });
        }

        return Accepted();
    }

}
