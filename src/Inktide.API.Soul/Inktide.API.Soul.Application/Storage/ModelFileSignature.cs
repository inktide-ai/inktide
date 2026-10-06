namespace Inktide.API.Soul.Application.Storage;

/// <summary>
/// Checks that a model file's first bytes match its extension, so a renamed HTML or
/// executable can't be stored and later served from the public bucket as a "model".
/// </summary>
public static class ModelFileSignature
{
    /// <summary>How many leading bytes <see cref="Matches"/> needs.</summary>
    public const int HeadBytes = 16;

    private static ReadOnlySpan<byte> Utf8Bom => [0xEF, 0xBB, 0xBF];

    public static bool Matches(string fileName, ReadOnlySpan<byte> head)
    {
        switch (Path.GetExtension(fileName).ToLowerInvariant())
        {
            case ".vrm":
            case ".glb":
                return head.StartsWith("glTF"u8);
            case ".zip":
                return head.StartsWith("PK\x03\x04"u8);
            case ".gltf":
            case ".json":
                var text = head.StartsWith(Utf8Bom) ? head[Utf8Bom.Length..] : head;
                foreach (var b in text)
                {
                    if (b is (byte)' ' or (byte)'\t' or (byte)'\r' or (byte)'\n')
                        continue;
                    return b == (byte)'{';
                }
                return false;
            default:
                return false;
        }
    }
}
