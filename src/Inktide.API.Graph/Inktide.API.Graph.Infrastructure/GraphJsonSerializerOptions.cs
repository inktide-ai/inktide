using System.Text.Json;

namespace Inktide.API.Graph.Infrastructure;

internal static class GraphJsonSerializerOptions
{
    internal static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };
}
