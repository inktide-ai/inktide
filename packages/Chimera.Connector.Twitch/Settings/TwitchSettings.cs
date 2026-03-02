using System.ComponentModel.DataAnnotations;

namespace Chimera.ApiGateway.Twitch.Settings;

/// <summary>
/// Twitch EventSub configuration for listening to channel chat messages.
/// </summary>
/// <remarks>
/// Create an app at https://dev.twitch.tv/console/apps and get ClientId/ClientSecret.
/// For channel.chat.message subscription, use App Access Token (Client Credentials flow)
/// or User Access Token with user:read:chat scope (broadcaster must authorize the app).
/// BroadcasterUserId: the channel to listen to (use Helix Users API to resolve username -> userId).
/// </remarks>
public sealed class TwitchSettings
{
    private string _clientId = string.Empty;
    private string _clientSecret = string.Empty;
    private string? _accessToken;
    private string _broadcasterUserId = string.Empty;
    private string _userId = string.Empty;
    private int _maxReconnectAttempts = 10;
    private int _reconnectBaseDelayMs = 1000;

    [Required(AllowEmptyStrings = false)]
    public string ClientId
    {
        get => _clientId;
        set => _clientId = value;
    }

    [Required(AllowEmptyStrings = false)]
    public string ClientSecret
    {
        get => _clientSecret;
        set => _clientSecret = value;
    }

    /// <summary>
    /// Optional. Pre-obtained App or User Access Token.
    /// When empty, Client Credentials flow is used automatically.
    /// </summary>
    public string? AccessToken
    {
        get => _accessToken;
        set => _accessToken = value;
    }

    [Required(AllowEmptyStrings = false)]
    public string BroadcasterUserId
    {
        get => _broadcasterUserId;
        set => _broadcasterUserId = value;
    }

    /// <summary>
    /// User ID used to read chat (for channel.chat.message subscription).
    /// Defaults to <see cref="BroadcasterUserId"/> when empty.
    /// </summary>
    public string UserId
    {
        get => _userId;
        set => _userId = value;
    }

    /// <summary>
    /// Max reconnect attempts before giving up. 0 = unlimited.
    /// </summary>
    public int MaxReconnectAttempts
    {
        get => _maxReconnectAttempts;
        set => _maxReconnectAttempts = value;
    }

    /// <summary>
    /// Initial delay between reconnect attempts (doubles each attempt, capped at 60s).
    /// </summary>
    public int ReconnectBaseDelayMs
    {
        get => _reconnectBaseDelayMs;
        set => _reconnectBaseDelayMs = value;
    }
}
