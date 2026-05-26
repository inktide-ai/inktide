using System.Text.Json;

namespace Inktide.API.TTS.Infrastructure;

internal static class JsonElementExtensions
{
    internal static string? GetStringOrNull(this JsonElement el, string property)
    {
        if (el.TryGetProperty(property, out var v) && v.ValueKind == JsonValueKind.String)
            return v.GetString();
        return null;
    }
}
