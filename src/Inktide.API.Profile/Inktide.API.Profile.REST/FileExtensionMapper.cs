namespace Inktide.API.Profile.REST;

internal static class FileExtensionMapper
{
    internal static string FromContentTypeOrFileName(string? contentType, string? fileName)
    {
        var extFromMime = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png"  => ".png",
            "image/gif"  => ".gif",
            "image/webp" => ".webp",
            "image/avif" => ".avif",
            _            => null
        };
        if (extFromMime is not null) return extFromMime;

        if (!string.IsNullOrWhiteSpace(fileName))
        {
            var ext = Path.GetExtension(fileName);
            if (!string.IsNullOrEmpty(ext) && System.Text.RegularExpressions.Regex.IsMatch(ext, @"^\.[a-zA-Z0-9]{1,8}$"))
                return ext.ToLowerInvariant();
        }

        return ".bin";
    }
}
