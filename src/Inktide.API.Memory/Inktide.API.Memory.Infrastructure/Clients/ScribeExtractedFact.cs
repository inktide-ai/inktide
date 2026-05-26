using System.Text.Json.Serialization;

namespace Inktide.API.Memory.Infrastructure.Clients;

internal sealed record ScribeExtractedFact
{
    [JsonPropertyName("text")]       public string Text { get; init; } = string.Empty;
    [JsonPropertyName("type")]       public string Type { get; init; } = "fact";
    [JsonPropertyName("entities")]   public List<string> Entities { get; init; } = [];
    [JsonPropertyName("importance")] public double Importance { get; init; }
}
