using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Connector.Discord.Settings;

/// <summary>
/// Discord bot configuration for listening to guild channel messages via Gateway WebSocket.
/// </summary>
/// <remarks>
/// Create a bot at https://discord.com/developers/applications.
/// Enable "Message Content Intent" in Bot settings.
/// Token is the Bot Token from the Bot page (not OAuth2 client secret).
/// </remarks>
public sealed class DiscordSettings
{
    private string _botToken = string.Empty;
    private string _clientId = string.Empty;
    private string _clientSecret = string.Empty;
    private string _redirectUri = string.Empty;
    private List<ulong> _guildIds = [];
    private List<ulong> _channelIds = [];
    private bool _ignoreBots = true;
    private int _maxReconnectAttempts = 10;
    private int _reconnectBaseDelayMs = 1000;

    [Required(AllowEmptyStrings = false)]
    public string BotToken
    {
        get => _botToken;
        set => _botToken = value;
    }

    /// <summary>Discord Application Client ID (from Developer Portal → OAuth2).</summary>
    [Required(AllowEmptyStrings = false)]
    public string ClientId
    {
        get => _clientId;
        set => _clientId = value;
    }

    /// <summary>Discord Application Client Secret.</summary>
    [Required(AllowEmptyStrings = false)]
    public string ClientSecret
    {
        get => _clientSecret;
        set => _clientSecret = value;
    }

    /// <summary>OAuth2 redirect URI registered in Discord Developer Portal.</summary>
    [Required(AllowEmptyStrings = false)]
    public string RedirectUri
    {
        get => _redirectUri;
        set => _redirectUri = value;
    }

    /// <summary>Frontend base URL used to redirect the browser after OAuth callback.</summary>
    [Required(AllowEmptyStrings = false)]
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    /// <summary>
    /// Display name stored as BotUsername in the channel record.
    /// Defaults to "Inktide" — override in config to match your bot's actual display name.
    /// </summary>
    public string BotUsername { get; init; } = "Inktide";

    /// <summary>
    /// Guild (server) IDs to listen to. Empty = listen to all guilds the bot is in.
    /// </summary>
    public List<ulong> GuildIds
    {
        get => _guildIds;
        set => _guildIds = value;
    }

    /// <summary>
    /// Channel IDs to listen to. Empty = listen to all text channels in allowed guilds.
    /// </summary>
    public List<ulong> ChannelIds
    {
        get => _channelIds;
        set => _channelIds = value;
    }

    /// <summary>
    /// Whether to ignore messages from other bots.
    /// </summary>
    public bool IgnoreBots
    {
        get => _ignoreBots;
        set => _ignoreBots = value;
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
