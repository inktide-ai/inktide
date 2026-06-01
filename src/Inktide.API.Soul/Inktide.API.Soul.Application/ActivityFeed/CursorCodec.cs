using System.Buffers.Binary;

namespace Inktide.API.Soul.Application.ActivityFeed;

/// <summary>
/// Encodes/decodes a 16-byte opaque keyset cursor: 8 bytes OccurredAt ticks (big-endian) + 8 bytes GUID.
/// Base64Url-encoded; tamper-resistant by obscurity (not signed — acceptable since no privilege escalation
/// is possible from a forged cursor; all rows are already filtered by card id and visibility).
/// </summary>
public static class CursorCodec
{
    public static string Encode(DateTime occurredAt, Guid id)
    {
        var bytes = new byte[16];
        BinaryPrimitives.WriteInt64BigEndian(bytes, occurredAt.Ticks);
        id.TryWriteBytes(bytes.AsSpan(8));
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    public static DateTime? Decode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded)) return null;
        try
        {
            string padded = encoded.Replace('-', '+').Replace('_', '/');
            int padding = (4 - padded.Length % 4) % 4;
            padded += new string('=', padding);
            byte[] bytes = Convert.FromBase64String(padded);
            if (bytes.Length < 8) return null;
            long ticks = BinaryPrimitives.ReadInt64BigEndian(bytes);
            return new DateTime(ticks, DateTimeKind.Utc);
        }
        catch
        {
            return null;
        }
    }
}
