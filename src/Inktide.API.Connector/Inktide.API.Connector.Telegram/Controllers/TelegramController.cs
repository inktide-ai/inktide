using System.Security.Claims;
using Inktide.API.Connector.Telegram.Services;
using Inktide.API.Soul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Telegram.Controllers;

[ApiController]
[Route("api/connectors/telegram")]
[Produces("application/json")]
public sealed class TelegramController : ControllerBase
{
    private readonly ITelegramBotApiClient _telegram;
    private readonly IAiCardChannelLinkService _channels;
    private readonly IDataProtector _protector;
    private readonly ILogger<TelegramController> _log;

    public TelegramController(
        ITelegramBotApiClient telegram,
        IAiCardChannelLinkService channels,
        IDataProtectionProvider dp,
        ILogger<TelegramController> log)
    {
        _telegram  = telegram;
        _channels  = channels;
        _protector = dp.CreateProtector("Telegram.BotTokens");
        _log       = log;
    }

    /// <summary>Validates a Telegram bot token by calling /getMe.</summary>
    [HttpPost("validate-token")]
    [ProducesResponseType(typeof(ValidateTokenResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateToken(
        [FromBody] ValidateTokenRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.BotToken))
        {
            return Ok(
                new ValidateTokenResponse(
                    false, 
                    null, 
                    "Bot token is required."));
        }

        var username = await _telegram
            .GetBotUsernameAsync(req.BotToken.Trim(), ct);
        
        return Ok(username is not null
            ? new ValidateTokenResponse(true, username, null)
            : new ValidateTokenResponse(false, null, "Invalid bot token — Telegram rejected it."));
    }

    /// <summary>Saves a Telegram bot channel for the given soul card.</summary>
    [HttpPost("channels")]
    [Authorize]
    [ProducesResponseType(typeof(CreateChannelResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateChannel(
        [FromBody] CreateChannelRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.BotToken))
            return BadRequest("Bot token is required.");
        if (string.IsNullOrWhiteSpace(req.ChatId))
            return BadRequest("Chat ID is required.");
        if (string.IsNullOrWhiteSpace(req.ChatName))
            return BadRequest("Chat name is required.");

        var userId          = GetUserId();
        var encryptedToken  = _protector.Protect(req.BotToken.Trim());

        var channelId = await _channels.UpsertTelegramChannelAsync(
            userId,
            req.CardId,
            req.ChatId.Trim(),
            req.ChatName.Trim(),
            encryptedToken,
            ct);

        _log.LogInformation(
            "User {UserId} connected Telegram chat {ChatId} to card {CardId}",
            userId, req.ChatId, req.CardId);

        return StatusCode(StatusCodes.Status201Created, new CreateChannelResponse(channelId));
    }

    /// <summary>Deactivates a Telegram channel connection.</summary>
    [HttpPost("revoke/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(Guid channelId, CancellationToken ct)
    {
        var userId = GetUserId();
        await _channels.DeactivateAsync(userId, channelId, ct);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

    public sealed record ValidateTokenRequest(string BotToken);
    public sealed record ValidateTokenResponse(bool Valid, string? Username, string? Error);
    public sealed record CreateChannelRequest(Guid CardId, string BotToken, string ChatId, string ChatName);
    public sealed record CreateChannelResponse(Guid ChannelId);
    
}
