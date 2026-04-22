using System.Text.Json.Serialization;

namespace Chimera.API.Memory.Infrastructure.Clients;

internal sealed class ConversationTurnRequest
{
    [JsonPropertyName("userMessage")]
    public UserMessage UserMessage { get; set; } = new();

    [JsonPropertyName("botResponse")]
    public string BotResponse { get; set; } = string.Empty;

    [JsonPropertyName("platform")]
    public string? Platform { get; set; }

    [JsonPropertyName("channelId")]
    public string? ChannelId { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTimeOffset? Timestamp { get; set; }
}