using System.Text.Json.Serialization;

namespace Inktide.API.Memory.Infrastructure.Clients;

internal sealed record FactExtractionResponse
{
    [JsonPropertyName("facts")] public List<ScribeExtractedFact> Facts { get; init; } = [];
}
