using System.Numerics;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using SkiaSharp;

namespace Inktide.API.ScreenAwareness.Infrastructure.Hashing;

/// <summary>
/// Difference-hash (dHash) implementation.
/// Algorithm: resize to 9x8 grayscale -> compute 8x8 horizontal gradients -> pack 64 bits into ulong.
/// Hamming distance via BitOperations.PopCount on XOR.
/// </summary>
public sealed class PHashService : IPhashService
{
    // Mipmapped sampling averages the whole frame into each of the 9x8 cells.
    private static readonly SKSamplingOptions Sampling = new(SKFilterMode.Linear, SKMipmapMode.Linear);

    public ulong ComputeHash(string frameBase64)
    {
        var bytes = Convert.FromBase64String(frameBase64);
        using var frame = SKImage.FromEncodedData(bytes)
            ?? throw new InvalidDataException("The frame is not a decodable image.");

        using var small = new SKBitmap(new SKImageInfo(9, 8, SKColorType.Rgba8888, SKAlphaType.Premul));
        using (var canvas = new SKCanvas(small))
            canvas.DrawImage(frame, SKRect.Create(9, 8), Sampling);

        ulong hash = 0;
        int bit = 0;

        for (int y = 0; y < 8; y++)
        {
            for (int x = 0; x < 8; x++)
            {
                var left  = Luma(small.GetPixel(x, y));
                var right = Luma(small.GetPixel(x + 1, y));
                if (left > right)
                    hash |= 1UL << bit;
                bit++;
            }
        }

        return hash;
    }

    public int HammingDistance(ulong a, ulong b)
        => BitOperations.PopCount(a ^ b);

    // ITU-R BT.709 luminance, the same weights as the grayscale step this replaced.
    private static byte Luma(SKColor c)
        => (byte)Math.Round(0.2126 * c.Red + 0.7152 * c.Green + 0.0722 * c.Blue);

}
