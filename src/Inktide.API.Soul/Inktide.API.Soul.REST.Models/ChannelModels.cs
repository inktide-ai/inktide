using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class CreateChannelRequest
{
    /// <summary>Platform-specific stable id (e.g. Discord guild id).</summary>
    [JsonProperty("channel_id")]
    public string? ChannelId { get; set; }

    [JsonProperty("platform")]
    public string Platform { get; set; } = "twitch";

    [JsonProperty("channel_name")]
    public string ChannelName { get; set; } = string.Empty;

    [JsonProperty("bot_username")]
    public string BotUsername { get; set; } = string.Empty;

    [JsonProperty("oauth_token")]
    public string? OAuthToken { get; set; }

    [JsonProperty("custom_bot_token")]
    public string? CustomBotToken { get; set; }
}

public sealed class PatchChannelRequest
{
    [JsonProperty("is_active")]
    public bool IsActive { get; set; }
}

public sealed class ChannelResponse
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("platform")]
    public string Platform { get; set; } = string.Empty;

    [JsonProperty("channel_name")]
    public string ChannelName { get; set; } = string.Empty;

    /// <summary>Platform-specific stable id (e.g. Discord guild id).</summary>
    [JsonProperty("channel_id")]
    public string? ChannelId { get; set; }

    [JsonProperty("bot_username")]
    public string BotUsername { get; set; } = string.Empty;

    [JsonProperty("is_active")]
    public bool IsActive { get; set; }

    [JsonProperty("connected_at")]
    public DateTime? ConnectedAt { get; set; }

    [JsonProperty("has_custom_bot")]
    public bool HasCustomBot { get; set; }
}

public sealed class ToolResponse
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("tool_name")]
    public string ToolName { get; set; } = string.Empty;

    /// <summary>Tool-specific settings (flexible JSONB — shape varies per tool_name).</summary>
    [JsonProperty("tool_config")]
    public object? ToolConfig { get; set; }

    [JsonProperty("is_enabled")]
    public bool IsEnabled { get; set; }
}
