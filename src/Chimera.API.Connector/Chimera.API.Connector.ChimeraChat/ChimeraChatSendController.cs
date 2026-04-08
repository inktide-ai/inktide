using System.Security.Claims;
using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.ChimeraChat.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Connector.ChimeraChat;

[ApiController]
[Route("api/connector/chat")]
[Authorize]
public sealed class ChimeraChatSendController : ControllerBase
{
    private readonly IChimeraChatInbox _inbox;
    private readonly ILogger<ChimeraChatSendController> _logger;

    public ChimeraChatSendController(
        IChimeraChatInbox inbox,
        ILogger<ChimeraChatSendController> logger)
    {
        _inbox = inbox ?? throw new ArgumentNullException(nameof(inbox));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Enqueues a browser chat message for the Synapse pipeline.
    /// <c>channelId</c> must be <c>"{cardId}:{userId}"</c> where <c>userId</c> matches
    /// the authenticated principal — enforced server-side to prevent channel hijacking.
    /// </summary>
    [HttpPost("send")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public IActionResult Send([FromBody] ChimeraChatSendRequest request)
    {
        var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Unauthorized();

        if (!ChannelBelongsToUser(request.ChannelId, userId))
            return BadRequest(new { error = "channelId must be in the format '{cardId}:{userId}' where userId matches the authenticated user." });

        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "Text must not be empty or whitespace-only." });

        var userName = User.FindFirstValue("preferred_username")
                       ?? User.FindFirstValue(ClaimTypes.Name)
                       ?? userId;

        _logger.LogDebug(
            "[ChimeraChat] Incoming message. Channel={ChannelId} User={UserName} Chars={Chars}",
            request.ChannelId, userName, request.Text.Length);

        if (!_inbox.TryEnqueue(request.ChannelId, userId, userName, request.Text))
        {
            _logger.LogWarning(
                "[ChimeraChat] Inbox full — returning 429. Channel={ChannelId} User={UserName}",
                request.ChannelId, userName);

            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Inbox is currently full. Please try again shortly." });
        }

        return Accepted();
    }

    // channelId format: "{cardId}:{userId}" — verify the userId segment matches the token subject.
    private static bool ChannelBelongsToUser(string channelId, string userId)
    {
        var sep = channelId.IndexOf(':');
        if (sep < 0) return false;

        return channelId.AsSpan(sep + 1).Equals(userId.AsSpan(), StringComparison.Ordinal);
    }
}
