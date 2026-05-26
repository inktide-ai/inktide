using System.Text.Json.Serialization;

namespace Inktide.API.Memory.Infrastructure.Clients;

internal sealed record ConversationTurnRequest
{
    [JsonPropertyName("userMessage")]  public UserMessage UserMessage { get; init; } = new();
    [JsonPropertyName("botResponse")]  public string BotResponse { get; init; } = string.Empty;
    [JsonPropertyName("platform")]     public string? Platform { get; init; }
    [JsonPropertyName("channelId")]    public string? ChannelId { get; init; }
    [JsonPropertyName("timestamp")]    public DateTimeOffset? Timestamp { get; init; }
}
