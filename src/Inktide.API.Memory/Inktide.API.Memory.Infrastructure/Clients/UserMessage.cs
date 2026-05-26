using System.Text.Json.Serialization;

namespace Inktide.API.Memory.Infrastructure.Clients;

internal sealed record UserMessage
{
    [JsonPropertyName("sender")] public string Sender { get; init; } = string.Empty;
    [JsonPropertyName("text")]   public string Text { get; init; } = string.Empty;
}
