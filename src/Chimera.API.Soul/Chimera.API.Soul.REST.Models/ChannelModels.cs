using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class CreateChannelRequest
{
    #region Fields

    private string _platform = "twitch";
    private string _channelName = string.Empty;
    private string _botUsername = string.Empty;
    private string? _oAuthToken;

    #endregion

    #region Properties

    [JsonProperty("platform")]
    public string Platform
    {
        get => _platform;
        set => _platform = value;
    }

    [JsonProperty("channel_name")]
    public string ChannelName
    {
        get => _channelName;
        set => _channelName = value;
    }

    [JsonProperty("bot_username")]
    public string BotUsername
    {
        get => _botUsername;
        set => _botUsername = value;
    }

    [JsonProperty("oauth_token")]
    public string? OAuthToken
    {
        get => _oAuthToken;
        set => _oAuthToken = value;
    }

    #endregion
}

public sealed class ChannelResponse
{
    #region Fields

    private Guid _id;
    private string _platform = string.Empty;
    private string _channelName = string.Empty;
    private string _botUsername = string.Empty;
    private bool _isActive;
    private DateTime? _connectedAt;

    #endregion

    #region Properties

    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("platform")]
    public string Platform
    {
        get => _platform;
        set => _platform = value;
    }

    [JsonProperty("channel_name")]
    public string ChannelName
    {
        get => _channelName;
        set => _channelName = value;
    }

    [JsonProperty("bot_username")]
    public string BotUsername
    {
        get => _botUsername;
        set => _botUsername = value;
    }

    [JsonProperty("is_active")]
    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    [JsonProperty("connected_at")]
    public DateTime? ConnectedAt
    {
        get => _connectedAt;
        set => _connectedAt = value;
    }

    #endregion
}

public sealed class ToolResponse
{
    #region Fields

    private Guid _id;
    private string _toolName = string.Empty;
    private object? _toolConfig;
    private bool _isEnabled;

    #endregion

    #region Properties

    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("tool_name")]
    public string ToolName
    {
        get => _toolName;
        set => _toolName = value;
    }

    [JsonProperty("tool_config")]
    public object? ToolConfig
    {
        get => _toolConfig;
        set => _toolConfig = value;
    }

    [JsonProperty("is_enabled")]
    public bool IsEnabled
    {
        get => _isEnabled;
        set => _isEnabled = value;
    }

    #endregion
}
