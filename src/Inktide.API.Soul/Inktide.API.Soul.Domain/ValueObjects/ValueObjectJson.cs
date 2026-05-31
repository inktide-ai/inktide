using System.Text.Json;

namespace Inktide.API.Soul.Domain.ValueObjects;

internal static class ValueObjectJson
{
    internal static readonly JsonSerializerOptions Opts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
    };

    internal static T ParseOrDefault<T>(string? json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json)) return new T();
        // Let JsonException propagate — corrupt JSONB surfaces as a 500 rather than silently
        // returning defaults that mask data loss. Empty/null JSON is the only "no value" signal.
        return JsonSerializer.Deserialize<T>(json, Opts) ?? new T();
    }
}
