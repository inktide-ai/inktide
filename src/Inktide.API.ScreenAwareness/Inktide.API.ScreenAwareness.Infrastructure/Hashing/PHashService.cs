using System.Numerics;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Inktide.API.ScreenAwareness.Infrastructure.Hashing;

/// <summary>
/// Difference-hash (dHash) implementation.
/// Algorithm: resize to 9×8 grayscale → compute 8×8 horizontal gradients → pack 64 bits into ulong.
/// Hamming distance via BitOperations.PopCount on XOR.
/// </summary>
public sealed class PHashService : IPhashService
{

    public ulong ComputeHash(string frameBase64)
    {
        var bytes = Convert.FromBase64String(frameBase64);
        using var image = Image.Load<Rgba32>(bytes);

        image.Mutate(x => x
            .Resize(9, 8)
            .Grayscale());

        ulong hash = 0;
        int bit = 0;

        for (int y = 0; y < 8; y++)
        {
            for (int x = 0; x < 8; x++)
            {
                var left  = image[x, y].R;
                var right = image[x + 1, y].R;
                if (left > right)
                    hash |= 1UL << bit;
                bit++;
            }
        }

        return hash;
    }

    public int HammingDistance(ulong a, ulong b)
        => BitOperations.PopCount(a ^ b);

}
