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
        try { return JsonSerializer.Deserialize<T>(json, Opts) ?? new T(); }
        catch (JsonException)
        {
            // Corrupt JSON returns defaults. Chosen over ILogger to avoid domain → infrastructure dependency.
            System.Diagnostics.Trace.TraceWarning($"[{typeof(T).Name}] JSON parse failed, using defaults");
            return new T();
        }
    }
}
