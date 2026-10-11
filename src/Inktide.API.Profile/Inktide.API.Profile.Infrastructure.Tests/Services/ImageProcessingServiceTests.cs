using System.Text;
using Inktide.API.Profile.Infrastructure.Services;
using SkiaSharp;
using Xunit;

namespace Inktide.API.Profile.Infrastructure.Tests.Services;

public sealed class ImageProcessingServiceTests
{
    private const uint Red = 0xFFFF0000, Green = 0xFF00FF00, Blue = 0xFF0000FF, Yellow = 0xFFFFFF00;

    private static readonly ImageProcessingService Service = new();

    [Fact]
    public async Task Crops_the_centre_square_and_scales_it_to_a_200px_webp()
    {
        // Red | green | blue thirds: the centre square is the green third.
        var source = Encode(Paint(300, 100, (x, _) => x < 100 ? Red : x < 200 ? Green : Blue), SKEncodedImageFormat.Png);

        using var result = await Service.ResizeAvatarAsync(new MemoryStream(source));

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.ContentType);
        Assert.Equal(".webp", result.Extension);
        var bytes = ReadAll(result.Data);
        Assert.Equal("RIFF", Encoding.ASCII.GetString(bytes, 0, 4));
        Assert.Equal("WEBP", Encoding.ASCII.GetString(bytes, 8, 4));
        using var avatar = SKBitmap.Decode(bytes);
        Assert.Equal((200, 200), (avatar.Width, avatar.Height));
        AssertColor(Green, avatar.GetPixel(4, 100));
        AssertColor(Green, avatar.GetPixel(195, 100));
    }

    [Fact]
    public async Task Returns_null_and_leaves_the_stream_in_place_for_bytes_that_are_not_an_image()
    {
        // FileUploadService then stores the original upload from this same stream.
        var input = new MemoryStream("definitely not an image"u8.ToArray());

        var result = await Service.ResizeAvatarAsync(input);

        Assert.Null(result);
        Assert.Equal(0, input.Position);
    }

    // Stored quadrants: red | green over blue | yellow. Each EXIF orientation says how to turn the
    // stored pixels upright; the expected colours are the upright image's top-left and top-right.
    [Theory]
    [InlineData(1, Red, Green)]     // upright
    [InlineData(2, Green, Red)]     // mirrored horizontally
    [InlineData(3, Yellow, Blue)]   // rotated 180°
    [InlineData(4, Blue, Yellow)]   // mirrored vertically
    [InlineData(5, Red, Blue)]      // transposed
    [InlineData(6, Blue, Red)]      // needs 90° clockwise
    [InlineData(7, Yellow, Green)]  // transversed
    [InlineData(8, Green, Yellow)]  // needs 90° counter-clockwise
    public async Task Turns_phone_photos_upright_from_their_exif_orientation(int orientation, uint topLeft, uint topRight)
    {
        var stored = Paint(200, 200, (x, y) => (x < 100, y < 100) switch
        {
            (true, true)   => Red,
            (false, true)  => Green,
            (true, false)  => Blue,
            (false, false) => Yellow,
        });
        var photo = WithExifOrientation(Encode(stored, SKEncodedImageFormat.Jpeg), orientation);

        using var result = await Service.ResizeAvatarAsync(new MemoryStream(photo));

        Assert.NotNull(result);
        using var avatar = SKBitmap.Decode(ReadAll(result.Data));
        AssertColor(topLeft, avatar.GetPixel(50, 50));
        AssertColor(topRight, avatar.GetPixel(150, 50));
    }

    private static SKBitmap Paint(int width, int height, Func<int, int, uint> color)
    {
        var bitmap = new SKBitmap(width, height);
        for (var y = 0; y < height; y++)
            for (var x = 0; x < width; x++)
                bitmap.SetPixel(x, y, new SKColor(color(x, y)));
        return bitmap;
    }

    private static byte[] Encode(SKBitmap bitmap, SKEncodedImageFormat format)
    {
        using (bitmap)
        using (var data = bitmap.Encode(format, 95))
            return data.ToArray();
    }

    // Inserts an APP1 "Exif" segment right after SOI: a big-endian TIFF header with one IFD
    // entry, Orientation (tag 0x0112, type SHORT, count 1).
    private static byte[] WithExifOrientation(byte[] jpeg, int orientation)
    {
        byte[] app1 =
        [
            0xFF, 0xE1, 0x00, 0x22,
            (byte)'E', (byte)'x', (byte)'i', (byte)'f', 0x00, 0x00,
            (byte)'M', (byte)'M', 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08,
            0x00, 0x01,
            0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, (byte)orientation, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
        ];
        return [.. jpeg[..2], .. app1, .. jpeg[2..]];
    }

    private static byte[] ReadAll(Stream stream)
    {
        using var copy = new MemoryStream();
        stream.CopyTo(copy);
        return copy.ToArray();
    }

    // WebP and JPEG are lossy, so colours only need to be close.
    private static void AssertColor(uint expected, SKColor actual)
    {
        var e = new SKColor(expected);
        Assert.True(
            Math.Abs(e.Red - actual.Red) < 48 && Math.Abs(e.Green - actual.Green) < 48 && Math.Abs(e.Blue - actual.Blue) < 48,
            $"expected {e}, got {actual}");
    }
}
