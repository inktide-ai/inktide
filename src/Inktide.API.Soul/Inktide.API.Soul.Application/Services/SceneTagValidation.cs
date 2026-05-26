namespace Inktide.API.Soul.Application.Services;

internal static class SceneTagValidation
{
    /// <summary>Validates and trims a scene tag (max 128 chars, null/empty = clear). Returns null on success.</summary>
    internal static string? TryNormalizeTag(string? tag, out string? normalized)
    {
        normalized = null;
        if (tag is null || string.IsNullOrWhiteSpace(tag)) return null;
        var t = tag.Trim();
        if (t.Length > 128) return "tag must be at most 128 characters.";
        normalized = t;
        return null;
    }

    /// <summary>Validates and trims an optional string field with a maximum character limit. Returns null on success.</summary>
    internal static string? TryNormalizeMaxLength(string? value, int maxLength, string fieldName, out string? normalized)
    {
        normalized = null;
        if (value is null || string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (v.Length > maxLength) return $"{fieldName} must be at most {maxLength} characters.";
        normalized = v;
        return null;
    }
}
