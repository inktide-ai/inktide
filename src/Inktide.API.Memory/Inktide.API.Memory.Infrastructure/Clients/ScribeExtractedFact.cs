using System.Text.Json.Serialization;

namespace Inktide.API.Memory.Infrastructure.Clients;

internal sealed class ScribeExtractedFact
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "fact";

    [JsonPropertyName("entities")]
    public List<string> Entities { get; set; } = [];

    [JsonPropertyName("importance")]
    public double Importance { get; set; }
}