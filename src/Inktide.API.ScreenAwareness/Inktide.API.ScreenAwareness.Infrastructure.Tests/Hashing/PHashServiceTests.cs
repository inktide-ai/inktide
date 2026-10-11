using Inktide.API.ScreenAwareness.Application.Settings;
using Inktide.API.ScreenAwareness.Infrastructure.Hashing;
using SkiaSharp;
using Xunit;

namespace Inktide.API.ScreenAwareness.Infrastructure.Tests.Hashing;

public sealed class PHashServiceTests
{
    private static readonly PHashService Service = new();
    private static readonly int Threshold = new ScreenAwarenessSettings().PHashThresholdDefault;

    [Fact]
    public void A_frame_brightening_left_to_right_hashes_to_zero_and_its_mirror_to_all_ones()
    {
        // dHash sets a bit where a pixel is brighter than its right neighbour.
        Assert.Equal(0UL, Hash(Gradient(brightening: true), SKEncodedImageFormat.Png));
        Assert.Equal(ulong.MaxValue, Hash(Gradient(brightening: false), SKEncodedImageFormat.Png));
    }

    [Fact]
    public void The_same_screen_resent_as_jpeg_counts_as_a_duplicate()
    {
        var png  = Hash(Screen(), SKEncodedImageFormat.Png);
        var jpeg = Hash(Screen(), SKEncodedImageFormat.Jpeg, quality: 70);

        Assert.True(Service.HammingDistance(png, jpeg) < Threshold);
    }

    [Fact]
    public void Different_screens_are_not_duplicates()
    {
        var a = Hash(Gradient(brightening: true), SKEncodedImageFormat.Jpeg);
        var b = Hash(Gradient(brightening: false), SKEncodedImageFormat.Jpeg);

        Assert.True(Service.HammingDistance(a, b) >= Threshold);
    }

    [Fact]
    public void Throws_on_a_frame_that_is_not_an_image() =>
        // FrameIngestionService catches this and skips dedup for the frame.
        Assert.ThrowsAny<Exception>(() => Service.ComputeHash(Convert.ToBase64String("not an image"u8.ToArray())));

    private static ulong Hash(SKBitmap frame, SKEncodedImageFormat format, int quality = 90)
    {
        using (frame)
        using (var data = frame.Encode(format, quality))
            return Service.ComputeHash(Convert.ToBase64String(data.ToArray()));
    }

    private static SKBitmap Gradient(bool brightening)
    {
        var bitmap = new SKBitmap(640, 360);
        for (var x = 0; x < 640; x++)
        {
            var level = (byte)(brightening ? x * 255 / 639 : 255 - x * 255 / 639);
            for (var y = 0; y < 360; y++)
                bitmap.SetPixel(x, y, new SKColor(level, level, level));
        }
        return bitmap;
    }

    // Something like a game screen: dark background, a bright HUD bar, a few coloured blocks.
    private static SKBitmap Screen()
    {
        var bitmap = new SKBitmap(1280, 720);
        using var canvas = new SKCanvas(bitmap);
        using var paint = new SKPaint();
        canvas.Clear(new SKColor(20, 24, 32));
        paint.Color = new SKColor(230, 230, 230);
        canvas.DrawRect(0, 0, 1280, 90, paint);
        paint.Color = new SKColor(220, 60, 60);
        canvas.DrawRect(120, 200, 300, 260, paint);
        paint.Color = new SKColor(60, 200, 90);
        canvas.DrawRect(700, 300, 420, 320, paint);
        paint.Color = new SKColor(250, 200, 60);
        canvas.DrawRect(500, 560, 160, 120, paint);
        return bitmap;
    }
}
