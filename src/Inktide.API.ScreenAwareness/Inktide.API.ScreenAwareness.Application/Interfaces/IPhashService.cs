namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>
/// Computes difference-hash (dHash) of a JPEG/PNG frame and measures Hamming distance
/// for scene-change deduplication.
/// </summary>
public interface IPhashService
{
    ulong ComputeHash(string frameBase64);
    int HammingDistance(ulong a, ulong b);
}
