using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Profile.Application.Interfaces;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class FileUploadService : IFileUploadService
{
    private readonly IObjectStorageService _storage;
    private readonly IImageProcessingService _imageProcessor;

    public FileUploadService(IObjectStorageService storage, IImageProcessingService imageProcessor)
    {
        _storage        = storage        ?? throw new ArgumentNullException(nameof(storage));
        _imageProcessor = imageProcessor ?? throw new ArgumentNullException(nameof(imageProcessor));
    }

    public async Task<UploadResult> UploadAsync(
        string userPrefix,
        Stream stream,
        string contentType,
        string fileName,
        long fileSize,
        CancellationToken ct = default)
    {
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            var processed = await _imageProcessor.ResizeAvatarAsync(stream, ct).ConfigureAwait(false);
            if (processed is not null)
            {
                using (processed)
                {
                    var objectKey = $"{userPrefix}{IdGenerator.New():N}{processed.Extension}";
                    await _storage.PutObjectAsync(objectKey, processed.Data, processed.ContentType, ct).ConfigureAwait(false);
                    return new UploadResult(objectKey, processed.Data.Length);
                }
            }
        }

        var fallbackExt = GetExtension(contentType, fileName);
        var fallbackKey = $"{userPrefix}{IdGenerator.New():N}{fallbackExt}";
        await _storage.PutObjectAsync(fallbackKey, stream, contentType, ct).ConfigureAwait(false);
        return new UploadResult(fallbackKey, fileSize);
    }

    private static string GetExtension(string? contentType, string? fileName)
    {
        var extFromMime = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png"  => ".png",
            "image/gif"  => ".gif",
            "image/webp" => ".webp",
            "image/avif" => ".avif",
            _            => null,
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
