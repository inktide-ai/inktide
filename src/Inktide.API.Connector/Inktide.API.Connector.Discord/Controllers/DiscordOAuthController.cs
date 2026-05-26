using System.Net.Http;
using Inktide.API.Connector.Application.Controllers;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.OAuth;
using Inktide.API.Connector.Discord.Settings;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Discord.Controllers;

[ApiController]
[Route("api/connectors/discord")]
[Produces("application/json")]
public sealed class DiscordOAuthController : ConnectorControllerBase
{
    private const string DiscordCurrentUserUrl = "https://discord.com/api/v10/users/@me";

    private readonly IDiscordOAuthService _oauth;
    private readonly IOAuthStateService _state;
    private readonly ITokenProtector _tokenProtector;
    private readonly IAiCardChannelConnectService _connect;
    private readonly IAiCardChannelLifecycleService _lifecycle;
    private readonly IGuildSoulRegistry _registry;
    private readonly ILogger<DiscordOAuthController> _log;
    private readonly IHttpClientFactory _http;
    private readonly string _frontendBaseUrl;
    private readonly string _botUsername;

    public DiscordOAuthController(
        IDiscordOAuthService oauth,
        IOAuthStateService state,
        [FromKeyedServices(TokenProtectorKeys.Discord)] ITokenProtector tokenProtector,
        IAiCardChannelConnectService connect,
        IAiCardChannelLifecycleService lifecycle,
        IGuildSoulRegistry registry,
        ILogger<DiscordOAuthController> log,
        IHttpClientFactory http,
        IOptions<DiscordSettings> settings)
    {
        _oauth           = oauth;
        _state           = state;
        _tokenProtector  = tokenProtector;
        _connect         = connect;
        _lifecycle       = lifecycle;
        _registry        = registry;
        _log             = log;
        _http            = http;
        _frontendBaseUrl = settings.Value.FrontendBaseUrl.TrimEnd('/');
        _botUsername     = settings.Value.BotUsername;
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
        if (!_state.TryVerify(state, out var ctx))
        {
            _log.LogWarning("Discord OAuth callback: invalid or expired state");
            return Redirect($"{_frontendBaseUrl}/souls?discord_error=invalid_state");
        }

        try
        {
            var tokens = await _oauth.ExchangeCodeAsync(code, ct);

            var resolvedGuildId = guildId ?? tokens.GuildId;
            var guildName       = tokens.GuildName;

            await _connect.UpsertAsync(
                new OAuthChannelUpsertCommand(
                    UserId:          ctx.UserId,
                    CardId:          ctx.CardId,
                    Platform:        DiscordConnector.PlatformIdValue,
                    ChannelId:       resolvedGuildId,
                    ChannelName:     guildName,
                    BotUsername:     _botUsername,
                    AccessTokenEnc:  _tokenProtector.Protect(tokens.AccessToken),
                    RefreshTokenEnc: _tokenProtector.Protect(tokens.RefreshToken),
                    TokenExpiresAt:  DateTime.UtcNow.AddSeconds(tokens.ExpiresIn)),
                ct);

            _registry.Register(resolvedGuildId, ctx.CardId);

            _log.LogInformation(
                "Discord guild {GuildId} ({GuildName}) connected to card {CardId} by user {UserId}",
                resolvedGuildId, guildName, ctx.CardId, ctx.UserId);

            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/discord?connected=true&guild={Uri.EscapeDataString(guildName)}");
        }
        catch (PlanLimitExceededException ex)
        {
            _log.LogInformation("Discord OAuth callback blocked by plan limit for card {CardId}: {Msg}", ctx.CardId, ex.Message);
            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/discord?discord_error=plan_limit");
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Discord OAuth callback failed for card {CardId}", ctx.CardId);
            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/discord?discord_error=exchange_failed");
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
        var channel = await _lifecycle.GetByIdAsync(userId, channelId, ct);
        if (channel is null) return NotFound();

        if (channel.OAuthTokenEnc is not null)
        {
            try { await _oauth.RevokeAsync(channel.OAuthTokenEnc, ct); }
            catch (Exception ex) { _log.LogWarning(ex, "Discord token revoke failed for channel {ChannelId}", channelId); }
        }

        if (channel.ChannelId is not null)
            _registry.Unregister(channel.ChannelId);

        if (!await _lifecycle.DeactivateAsync(userId, channelId, ct))
            return NotFound();
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
        var channel = await _lifecycle.GetByIdAsync(userId, channelId, ct);
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
        var channel = await _lifecycle.GetByIdAsync(userId, channelId, ct);
        if (channel is null) return NotFound();

        var encryptedToken = string.IsNullOrWhiteSpace(req.BotToken)
            ? null
            : _tokenProtector.Protect(req.BotToken);

        if (!await _lifecycle.SetCustomBotTokenAsync(userId, channelId, encryptedToken, ct))
            return NotFound();
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
        using var httpReq = new HttpRequestMessage(HttpMethod.Get, DiscordCurrentUserUrl);
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

    public sealed record InstallUrlResponse(string Url);
    public sealed record SetCustomBotRequest(string? BotToken);
    public sealed record ValidateTokenRequest(string BotToken);
    public sealed record ValidateTokenResponse(bool Valid, string? Error);
}
