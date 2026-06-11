using Inktide.API.Core.Controllers;
using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Application.Models;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Telegram.Services;
using Inktide.API.Connector.Telegram.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Telegram.Controllers;

[ApiController]
[Route("api/v1/connectors/telegram")]
[Produces("application/json")]
public sealed class TelegramController : ConnectorControllerBase
{
    // TODO: replace with TelegramConnector.PlatformIdValue once the connector class exists
    private const string PlatformId = "telegram";

    private readonly ITelegramBotApiClient _telegram;
    private readonly IConnectorChannelService _channels;
    private readonly ITelegramTokenProtector _tokenProtector;
    private readonly ILogger<TelegramController> _log;
    private readonly string _botUsername;

    public TelegramController(
        ITelegramBotApiClient telegram,
        IConnectorChannelService channels,
        ITelegramTokenProtector tokenProtector,
        ILogger<TelegramController> log,
        IOptions<TelegramSettings> settings)
    {
        _telegram       = telegram;
        _channels       = channels;
        _tokenProtector = tokenProtector;
        _log            = log;
        _botUsername    = settings.Value.BotUsername;
    }

    /// <summary>Validates a Telegram bot token by calling /getMe.</summary>
    [HttpPost("token-validations")]
    [Authorize]
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

        var userId         = GetUserId();
        var encryptedToken = _tokenProtector.Protect(req.BotToken.Trim());

        var channelId = await _channels.UpsertAsync(
            new ConnectorChannelUpsertCommand(
                UserId:       userId,
                CardId:       req.CardId,
                Platform:     PlatformId,
                ChannelId:    req.ChatId.Trim(),
                ChannelName:  req.ChatName.Trim(),
                BotUsername:  _botUsername,
                AccessTokenEnc: encryptedToken),
            ct);

        _log.LogInformation(
            "User {UserId} connected Telegram chat {ChatId} to card {CardId}",
            userId, req.ChatId, req.CardId);

        return StatusCode(StatusCodes.Status201Created, new CreateChannelResponse(channelId));
    }

    /// <summary>Deactivates a Telegram channel connection.</summary>
    [HttpDelete("channels/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid channelId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (!await _channels.DeactivateAsync(userId, channelId, ct))
            return NotFound();
        return NoContent();
    }

    public sealed record ValidateTokenRequest(string BotToken);
    public sealed record ValidateTokenResponse(bool Valid, string? Username, string? Error);
    public sealed record CreateChannelRequest(Guid CardId, string BotToken, string ChatId, string ChatName);
    public sealed record CreateChannelResponse(Guid ChannelId);
}
