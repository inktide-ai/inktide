using Inktide.API.Profile.Application.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class ImageProcessingService : IImageProcessingService
{
    private const int AvatarSize = 200;

    public async Task<ProcessedImage?> ResizeAvatarAsync(Stream input, CancellationToken ct = default)
    {
        Image image;
        try
        {
            image = await Image.LoadAsync(input, ct).ConfigureAwait(false);
        }
        catch (UnknownImageFormatException)
        {
            return null;
        }

        using (image)
        {
            // Center-crop to square then resize to AvatarSizexAvatarSize
            var size = Math.Min(image.Width, image.Height);
            image.Mutate(x => x
                .Crop(new Rectangle((image.Width - size) / 2, (image.Height - size) / 2, size, size))
                .Resize(AvatarSize, AvatarSize)
                .AutoOrient()); // strip EXIF orientation and apply it

            var output = new MemoryStream();
            await image.SaveAsync(output, new WebpEncoder { Quality = 85 }, ct).ConfigureAwait(false);
            output.Position = 0;

            return new ProcessedImage(output, "image/webp", ".webp");
        }
    }
}
