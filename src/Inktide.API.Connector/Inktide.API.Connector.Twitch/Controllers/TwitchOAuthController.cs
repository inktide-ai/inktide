using Inktide.API.Connector.Application.Controllers;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Twitch.Gateway;
using Inktide.API.Connector.Twitch.OAuth;
using Inktide.API.Connector.Twitch.Settings;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Twitch.Controllers;

[ApiController]
[Route("api/connectors/twitch")]
[Produces("application/json")]
public sealed class TwitchOAuthController : ConnectorControllerBase
{
    private readonly ITwitchOAuthService _oauth;
    private readonly IOAuthStateService _state;
    private readonly ITokenProtector _tokenProtector;
    private readonly IAiCardChannelConnectService _connect;
    private readonly IAiCardChannelLifecycleService _lifecycle;
    private readonly ITwitchChannelRegistry _registry;
    private readonly ITwitchConnector _connector;
    private readonly ILogger<TwitchOAuthController> _log;
    private readonly string _frontendBaseUrl;
    private readonly string _botUsername;

    public TwitchOAuthController(
        ITwitchOAuthService oauth,
        IOAuthStateService state,
        [FromKeyedServices(TokenProtectorKeys.Twitch)] ITokenProtector tokenProtector,
        IAiCardChannelConnectService connect,
        IAiCardChannelLifecycleService lifecycle,
        ITwitchChannelRegistry registry,
        ITwitchConnector connector,
        ILogger<TwitchOAuthController> log,
        IOptions<TwitchSettings> settings)
    {
        _oauth           = oauth           ?? throw new ArgumentNullException(nameof(oauth));
        _state           = state           ?? throw new ArgumentNullException(nameof(state));
        _tokenProtector  = tokenProtector  ?? throw new ArgumentNullException(nameof(tokenProtector));
        _connect         = connect         ?? throw new ArgumentNullException(nameof(connect));
        _lifecycle       = lifecycle       ?? throw new ArgumentNullException(nameof(lifecycle));
        _registry        = registry        ?? throw new ArgumentNullException(nameof(registry));
        _connector       = connector       ?? throw new ArgumentNullException(nameof(connector));
        _log             = log             ?? throw new ArgumentNullException(nameof(log));
        _frontendBaseUrl = settings.Value.FrontendBaseUrl.TrimEnd('/');
        _botUsername     = settings.Value.BotUsername;
    }

    /// <summary>Returns the Twitch OAuth2 authorization URL for a soul card.</summary>
    [HttpGet("install-url")]
    [Authorize]
    [ProducesResponseType(typeof(InstallUrlResponse), StatusCodes.Status200OK)]
    public IActionResult GetInstallUrl([FromQuery] Guid cardId)
    {
        var userId     = GetUserId();
        var stateToken = _state.CreateState(userId, cardId);
        var url        = _oauth.BuildInstallUrl(stateToken);
        return Ok(new InstallUrlResponse(url));
    }

    /// <summary>
    /// Twitch OAuth2 callback. Exchanges code for tokens, resolves broadcaster login,
    /// persists the connection, registers the channel, and redirects to the frontend.
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        [FromQuery] string code,
        [FromQuery] string state,
        CancellationToken ct)
    {
        if (!_state.TryVerify(state, out var ctx))
        {
            _log.LogWarning("Twitch OAuth callback: invalid or expired state");
            return Redirect($"{_frontendBaseUrl}/souls?twitch_error=invalid_state");
        }

        try
        {
            // Exchange authorization code for tokens
            var tokens = await _oauth.ExchangeCodeAsync(code, ct).ConfigureAwait(false);

            // Encrypt before storing — never persist raw tokens
            var accessTokenEnc  = _tokenProtector.Protect(tokens.AccessToken);
            var refreshTokenEnc = _tokenProtector.Protect(tokens.RefreshToken);

            // Resolve broadcaster login from Helix API using the plain access token
            var channelLogin = await _oauth.GetBroadcasterLoginAsync(tokens.AccessToken, ct).ConfigureAwait(false);

            // Persist connection
            await _connect.UpsertAsync(
                new OAuthChannelUpsertCommand(
                    UserId:          ctx.UserId,
                    CardId:          ctx.CardId,
                    Platform:        TwitchConnector.PlatformIdValue,
                    ChannelId:       channelLogin,
                    ChannelName:     channelLogin,
                    BotUsername:     _botUsername,
                    AccessTokenEnc:  accessTokenEnc,
                    RefreshTokenEnc: refreshTokenEnc,
                    TokenExpiresAt:  DateTime.UtcNow.AddSeconds(tokens.ExpiresIn)),
                ct).ConfigureAwait(false);

            // Register in-memory routing and join IRC channel (fire-and-forget: v1 known limitation)
            _registry.Register(channelLogin, ctx.CardId);
            _connector.JoinChannel(channelLogin);

            _log.LogInformation(
                "Twitch channel #{Login} connected to card {CardId} by user {UserId}",
                channelLogin, ctx.CardId, ctx.UserId);

            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/twitch?connected=true");
        }
        catch (PlanLimitExceededException ex)
        {
            _log.LogInformation("Twitch OAuth callback blocked by plan limit for card {CardId}: {Msg}", ctx.CardId, ex.Message);
            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/twitch?twitch_error=plan_limit");
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Twitch OAuth callback failed for card {CardId}", ctx.CardId);
            return Redirect($"{_frontendBaseUrl}/souls/{ctx.CardId}/channels/twitch?twitch_error=exchange_failed");
        }
    }

    /// <summary>Revokes a Twitch connection — deactivates in DB, leaves IRC channel, revokes token.</summary>
    [HttpPost("revoke/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid channelId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var channel = await _lifecycle.GetByIdAsync(userId, channelId, ct).ConfigureAwait(false);
        if (channel is null) return NotFound();

        // Leave IRC and unregister before DB deactivation
        if (channel.ChannelId is not null)
        {
            _connector.LeaveChannel(channel.ChannelId);
            _registry.Unregister(channel.ChannelId);
        }

        if (!await _lifecycle.DeactivateAsync(userId, channelId, ct).ConfigureAwait(false))
            return NotFound();

        // Best-effort token revocation — failure is logged but does not block the response
        if (channel.OAuthTokenEnc is not null)
        {
            try { await _oauth.RevokeAsync(channel.OAuthTokenEnc, ct).ConfigureAwait(false); }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Twitch token revoke failed for channel {ChannelId}", channelId);
            }
        }

        return NoContent();
    }

    /// <summary>Returns a new OAuth URL to reconnect a previously connected channel.</summary>
    [HttpPost("reconnect/{channelId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(InstallUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reconnect(Guid channelId, CancellationToken ct)
    {
        var userId  = GetUserId();
        var channel = await _lifecycle.GetByIdAsync(userId, channelId, ct).ConfigureAwait(false);
        if (channel is null) return NotFound();

        var stateToken = _state.CreateState(userId, channel.AiCardId);
        var url        = _oauth.BuildInstallUrl(stateToken);
        return Ok(new InstallUrlResponse(url));
    }

    public sealed record InstallUrlResponse(string Url);
}
