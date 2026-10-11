using Inktide.API.Profile.Application.Interfaces;
using SkiaSharp;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class ImageProcessingService : IImageProcessingService
{
    private const int AvatarSize = 200;
    private const int WebpQuality = 85;

    // Mipmapped sampling averages large photos down instead of skipping pixels.
    private static readonly SKSamplingOptions Sampling = new(SKFilterMode.Linear, SKMipmapMode.Linear);

    public async Task<ProcessedImage?> ResizeAvatarAsync(Stream input, CancellationToken ct = default)
    {
        var start = input.CanSeek ? input.Position : 0;
        using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, ct).ConfigureAwait(false);

        using var data = SKData.CreateCopy(buffer.ToArray());
        using var codec = SKCodec.Create(data);
        if (codec is null)
        {
            // Not an image: FileUploadService stores the original upload from this same stream.
            if (input.CanSeek) input.Position = start;
            return null;
        }

        using var decoded = SKBitmap.Decode(codec)
            ?? throw new InvalidDataException("The image could not be decoded.");
        using var image = SKImage.FromBitmap(decoded);

        // Center-crop to square then resize to AvatarSizexAvatarSize
        var side = Math.Min(image.Width, image.Height);
        using var square = image.Subset(SKRectI.Create((image.Width - side) / 2, (image.Height - side) / 2, side, side));

        using var surface = SKSurface.Create(new SKImageInfo(AvatarSize, AvatarSize));
        TurnUpright(surface.Canvas, codec.EncodedOrigin);
        surface.Canvas.DrawImage(square, SKRect.Create(AvatarSize, AvatarSize), Sampling);

        using var avatar = surface.Snapshot();
        using var webp = avatar.Encode(SKEncodedImageFormat.Webp, WebpQuality);
        return new ProcessedImage(new MemoryStream(webp.ToArray()), "image/webp", ".webp");
    }

    // Applies the EXIF orientation that phone cameras store instead of rotating the pixels.
    // The avatar is square, so every orientation is a turn and/or flip about its centre.
    private static void TurnUpright(SKCanvas canvas, SKEncodedOrigin origin)
    {
        const float c = AvatarSize / 2f;
        switch (origin)
        {
            case SKEncodedOrigin.TopRight:    canvas.Scale(-1, 1, c, c); break;
            case SKEncodedOrigin.BottomRight: canvas.RotateDegrees(180, c, c); break;
            case SKEncodedOrigin.BottomLeft:  canvas.Scale(1, -1, c, c); break;
            case SKEncodedOrigin.LeftTop:     canvas.Scale(-1, 1, c, c); canvas.RotateDegrees(90, c, c); break;
            case SKEncodedOrigin.RightTop:    canvas.RotateDegrees(90, c, c); break;
            case SKEncodedOrigin.RightBottom: canvas.Scale(1, -1, c, c); canvas.RotateDegrees(90, c, c); break;
            case SKEncodedOrigin.LeftBottom:  canvas.RotateDegrees(270, c, c); break;
        }
    }
}
