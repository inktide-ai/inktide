using System.Text.Json.Serialization;

namespace Chimera.API.Memory.Infrastructure.Clients;

internal sealed class FactExtractionResponse
{
    [JsonPropertyName("facts")]
    public List<ScribeExtractedFact> Facts { get; set; } = [];
}
