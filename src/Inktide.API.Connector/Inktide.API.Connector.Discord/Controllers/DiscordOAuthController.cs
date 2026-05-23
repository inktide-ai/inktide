using System.Net.Http;
using System.Security.Claims;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.OAuth;
using Inktide.API.Connector.Discord.Settings;
using Inktide.API.Soul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Discord.Controllers;

[ApiController]
[Route("api/connectors/discord")]
[Produces("application/json")]
public sealed class DiscordOAuthController : ControllerBase
{
    private readonly IDiscordOAuthService _oauth;
    private readonly DiscordOAuthStateService _state;
    private readonly IAiCardChannelLinkService _channels;
    private readonly IGuildSoulRegistry _registry;
    private readonly ILogger<DiscordOAuthController> _log;
    private readonly IHttpClientFactory _http;
    private readonly string _frontendBaseUrl;

    public DiscordOAuthController(
        IDiscordOAuthService oauth,
        DiscordOAuthStateService state,
        IAiCardChannelLinkService channels,
        IGuildSoulRegistry registry,
        ILogger<DiscordOAuthController> log,
        IHttpClientFactory http,
        IOptions<DiscordSettings> settings)
    {
        _oauth           = oauth;
        _state           = state;
        _channels        = channels;
        _registry        = registry;
        _log             = log;
        _http            = http;
        _frontendBaseUrl = settings.Value.FrontendBaseUrl.TrimEnd('/');
    }

    /// <summary>Returns the Discord OAuth2 install URL for a soul card.</summary>
    [HttpGet("install-url")]
    [Authorize]
    [ProducesResponseType(typeof(InstallUrlResponse), StatusCodes.Status200OK)]
    public IActionResult GetInstallUrl([FromQuery] Guid cardId)
    {
        var userId = GetUserId();
        var stateToken = _state.CreateState(userId, cardId);
        var url = _oauth.BuildInstallUrl(stateToken);
        return Ok(new InstallUrlResponse(url));
    }

    /// <summary>
    /// Discord OAuth2 callback. Exchanges code for tokens, stores the connection.
    /// Redirects browser to the soul channels page.
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        [FromQuery] string code,
        [FromQuery(Name = "guild_id")] string? guildId,
        [FromQuery] string state,
        CancellationToken ct)
    {
        (Guid userId, Guid cardId) parsed;
        try
        {
            parsed = _state.VerifyState(state);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Discord OAuth callback: invalid state");
            return Redirect($"{_frontendBaseUrl}/souls?discord_error=invalid_state");
        }

        try
        {
            var tokens = await _oauth.ExchangeCodeAsync(code, ct);

            var resolvedGuildId = guildId ?? tokens.GuildId;
            var guildName       = tokens.GuildName;

            await _channels.UpsertDiscordChannelAsync(
                userId:          parsed.userId,
                cardId:          parsed.cardId,
                guildId:         resolvedGuildId,
                guildName:       guildName,
                accessTokenEnc:  _oauth.Protect(tokens.AccessToken),
                refreshTokenEnc: _oauth.Protect(tokens.RefreshToken),
                tokenExpiresAt:  DateTime.UtcNow.AddSeconds(tokens.ExpiresIn),
                ct:              ct);

            _registry.Register(resolvedGuildId, parsed.cardId);

            _log.LogInformation(
                "Discord guild {GuildId} ({GuildName}) connected to card {CardId} by user {UserId}",
                resolvedGuildId, guildName, parsed.cardId, parsed.userId);

            return Redirect($"{_frontendBaseUrl}/souls/{parsed.cardId}/channels/discord?connected=true&guild={Uri.EscapeDataString(guildName)}");
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Discord OAuth callback failed for card {CardId}", parsed.cardId);
            return Redirect($"{_frontendBaseUrl}/souls/{parsed.cardId}/channels/discord?discord_error=exchange_failed");
        }
    }

    /// <summary>Revokes a Discord connection.</summary>
    [HttpPost("revoke/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid channelId, CancellationToken ct)
    {
        var userId = GetUserId();
        var channel = await _channels.GetByIdAsync(userId, channelId, ct);
        if (channel is null) return NotFound();

        if (channel.OAuthTokenEnc is not null)
        {
            try { await _oauth.RevokeAsync(channel.OAuthTokenEnc, ct); }
            catch (Exception ex) { _log.LogWarning(ex, "Discord token revoke failed for channel {ChannelId}", channelId); }
        }

        if (channel.ChannelId is not null)
            _registry.Unregister(channel.ChannelId);

        await _channels.DeactivateAsync(userId, channelId, ct);
        return NoContent();
    }

    /// <summary>Returns a new install URL to reconnect a previously connected guild.</summary>
    [HttpPost("reconnect/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InstallUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reconnect(Guid channelId, CancellationToken ct)
    {
        var userId = GetUserId();
        var channel = await _channels.GetByIdAsync(userId, channelId, ct);
        if (channel is null) return NotFound();

        var stateToken = _state.CreateState(userId, channel.AiCardId);
        var url = _oauth.BuildInstallUrl(stateToken);
        return Ok(new InstallUrlResponse(url));
    }

    /// <summary>Attaches a user-supplied bot token to an existing Discord channel.</summary>
    [HttpPost("channels/{channelId:guid}/custom-bot")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetCustomBot(Guid channelId, [FromBody] SetCustomBotRequest req, CancellationToken ct)
    {
        var userId = GetUserId();
        var channel = await _channels.GetByIdAsync(userId, channelId, ct);
        if (channel is null) return NotFound();

        var encryptedToken = string.IsNullOrWhiteSpace(req.BotToken)
            ? null
            : _oauth.Protect(req.BotToken);

        await _channels.SetCustomBotTokenAsync(userId, channelId, encryptedToken, ct);
        return NoContent();
    }

    /// <summary>Validates a Discord bot token by probing the Discord API.</summary>
    [HttpPost("validate-token")]
    [Authorize]
    [ProducesResponseType(typeof(ValidateTokenResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateToken(
        [FromBody] ValidateTokenRequest req, CancellationToken ct)
    {
        using var client = _http.CreateClient("discord-validate");
        using var httpReq = new HttpRequestMessage(HttpMethod.Get, "https://discord.com/api/v10/users/@me");
        httpReq.Headers.Add("Authorization", $"Bot {req.BotToken}");
        try
        {
            var res = await client.SendAsync(httpReq, ct);
            return Ok(new ValidateTokenResponse(
                res.IsSuccessStatusCode,
                res.IsSuccessStatusCode ? null : $"Discord returned {(int)res.StatusCode}"));
        }
        catch (Exception ex)
        {
            return Ok(new ValidateTokenResponse(false, ex.Message));
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

    public sealed record InstallUrlResponse(string Url);
    public sealed record SetCustomBotRequest(string? BotToken);
    public sealed record ValidateTokenRequest(string BotToken);
    public sealed record ValidateTokenResponse(bool Valid, string? Error);
}
