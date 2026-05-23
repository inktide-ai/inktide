namespace Inktide.API.Profile.Application.Interfaces;

/// <summary>
/// Resizes and converts an image for avatar storage.
/// Returns <c>null</c> when the input is not a recognized image format.
/// </summary>
public interface IImageProcessingService
{
    Task<ProcessedImage?> ResizeAvatarAsync(Stream input, CancellationToken ct = default);
}

/// <param name="Data">Processed image stream (caller must dispose).</param>
/// <param name="ContentType">e.g. "image/webp"</param>
/// <param name="Extension">e.g. ".webp"</param>
public sealed record ProcessedImage(Stream Data, string ContentType, string Extension) : IDisposable
{
    public void Dispose() => Data.Dispose();
}
