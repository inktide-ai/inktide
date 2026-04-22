using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class CreateChannelRequest
{

    private string _platform = "twitch";
    private string _channelName = string.Empty;
    private string? _channelId;
    private string _botUsername = string.Empty;
    private string? _oAuthToken;


    /// <summary>
    /// Platform-specific stable id (e.g. Discord guild id — must match connector ingest <c>ChannelId</c>).
    /// </summary>
    [JsonProperty("channel_id")]
    public string? ChannelId
    {
        get => _channelId;
        set => _channelId = value;
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

    [JsonProperty("oauth_token")]
    public string? OAuthToken
    {
        get => _oAuthToken;
        set => _oAuthToken = value;
    }

}

public sealed class PatchChannelRequest
{

    private bool _isActive;


    [JsonProperty("is_active")]
    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

}

public sealed class ChannelResponse
{

    private Guid _id;
    private string _platform = string.Empty;
    private string _channelName = string.Empty;
    private string? _channelIdResponse;
    private string _botUsername = string.Empty;
    private bool _isActive;
    private DateTime? _connectedAt;


    [JsonProperty("channel_id")]
    public string? ChannelId
    {
        get => _channelIdResponse;
        set => _channelIdResponse = value;
    }

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

}

public sealed class ToolResponse
{

    private Guid _id;
    private string _toolName = string.Empty;
    private object? _toolConfig;
    private bool _isEnabled;


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

}
