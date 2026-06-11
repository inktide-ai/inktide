namespace Inktide.API.Core.Storage;

/// <summary>
/// Pure static helpers for file-name sanitisation and content-type inference.
/// SRP: one place to change when naming/MIME rules change.
/// </summary>
public static class StorageFileHelper
{
    private static readonly Dictionary<string, string> ContentTypeMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"]  = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"]  = "image/png",
            [".webp"] = "image/webp",
            [".glb"]  = "model/gltf-binary",
            [".gltf"] = "model/gltf+json",
            [".vrm"]  = "application/octet-stream",
            [".zip"]  = "application/zip",
            [".json"] = "application/json",
        };

    /// <summary>
    /// Returns the leaf filename; falls back to <paramref name="fallback"/> when the name is null/empty.
    /// </summary>
    public static string SanitizeFileName(string? name, string fallback)
    {
        if (string.IsNullOrWhiteSpace(name)) return fallback;
        var leaf = Path.GetFileName(name);
        return string.IsNullOrEmpty(leaf) ? fallback : leaf;
    }

    /// <summary>
    /// Returns the explicit content type when provided; otherwise infers it from the file extension;
    /// falls back to <paramref name="fallback"/> when neither is available.
    /// </summary>
    public static string InferContentType(string? contentType, string? fileName, string fallback)
    {
        if (!string.IsNullOrWhiteSpace(contentType))
            return contentType.Trim();

        if (fileName is not null)
        {
            var ext = Path.GetExtension(fileName);
            if (!string.IsNullOrEmpty(ext) && ContentTypeMap.TryGetValue(ext, out var mapped))
                return mapped;
        }

        return fallback;
    }
}
