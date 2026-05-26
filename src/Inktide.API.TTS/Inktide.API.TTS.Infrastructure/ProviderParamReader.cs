namespace Inktide.API.TTS.Infrastructure;

internal static class ProviderParamReader
{
    internal static string? Get(IReadOnlyDictionary<string, object>? p, string key)
    {
        if (p is null || !p.TryGetValue(key, out var val)) return null;
        return val?.ToString();
    }

    internal static T GetNumeric<T>(IReadOnlyDictionary<string, object>? p, string key, T def)
        where T : struct, ISpanParsable<T>
    {
        var s = Get(p, key);
        if (string.IsNullOrWhiteSpace(s)) return def;
        return T.TryParse(s, System.Globalization.CultureInfo.InvariantCulture, out var v) ? v : def;
    }
}
