using System.Buffers;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Inktide.API.Soul.Application.Storage;

/// <summary>Who started a chunked upload and how many bytes they promised to send.</summary>
public sealed record ChunkedUploadSession(
    Guid Id,
    Guid UserId,
    Guid CardId,
    string FileName,
    long SizeBytes,
    DateTimeOffset CreatedAt);

public enum ChunkAppendStatus { Appended, OffsetMismatch, TooLarge }

public readonly record struct ChunkAppendOutcome(ChunkAppendStatus Status, long ReceivedBytes);

/// <summary>
/// Disk staging for chunked uploads. Per upload: <c>{id}.json</c> is the session,
/// <c>{id}.part</c> the bytes received so far, <c>{id}.done</c> the result once the file
/// reached object storage (so a retried "complete" gets the same answer instead of a 404).
/// The directory belongs to one API instance; running several replicas would need a shared volume.
/// </summary>
public sealed class ChunkedUploadStore
{
    private const int CopyBufferBytes = 81_920;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly string _root;
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();

    public ChunkedUploadStore(string root)
    {
        _root = root ?? throw new ArgumentNullException(nameof(root));
        Directory.CreateDirectory(_root);
    }

    public async Task CreateAsync(ChunkedUploadSession session, CancellationToken ct)
    {
        await File.WriteAllTextAsync(SessionPath(session.Id), JsonSerializer.Serialize(session, Json), ct)
            .ConfigureAwait(false);
        await using (File.Create(PartPath(session.Id))) { }
    }

    public Task<ChunkedUploadSession?> GetAsync(Guid id, CancellationToken ct) =>
        ReadJsonAsync<ChunkedUploadSession>(SessionPath(id), ct);

    public long GetReceivedBytes(Guid id)
    {
        var part = new FileInfo(PartPath(id));
        return part.Exists ? part.Length : 0;
    }

    /// <summary>
    /// Serialises work on one upload. A retried chunk can arrive while the server is still
    /// reading the dropped one; waiting lets that request finish so the retry sees the real offset.
    /// Null when the upload stayed busy for the whole <paramref name="wait"/>.
    /// </summary>
    public async Task<IDisposable?> TryLockAsync(Guid id, TimeSpan wait, CancellationToken ct)
    {
        var gate = _locks.GetOrAdd(id, _ => new SemaphoreSlim(1, 1));
        return await gate.WaitAsync(wait, ct).ConfigureAwait(false) ? new Releaser(gate) : null;
    }

    /// <summary>
    /// Appends <paramref name="data"/> when <paramref name="offset"/> is exactly what is stored.
    /// Bytes that arrived before a dropped connection are kept: TCP delivers them in order, so
    /// they are a valid prefix and the client continues from the new offset. Call under the lock.
    /// </summary>
    public async Task<ChunkAppendOutcome> AppendAsync(
        Guid id, long offset, Stream data, long sizeBytes, CancellationToken ct)
    {
        await using var file = new FileStream(
            PartPath(id), FileMode.Open, FileAccess.ReadWrite, FileShare.Read, CopyBufferBytes, useAsync: true);

        var received = file.Length;
        if (offset != received)
            return new(ChunkAppendStatus.OffsetMismatch, received);

        file.Seek(0, SeekOrigin.End);
        var buffer = ArrayPool<byte>.Shared.Rent(CopyBufferBytes);
        long written = 0;
        try
        {
            int read;
            while ((read = await data.ReadAsync(buffer.AsMemory(0, CopyBufferBytes), ct).ConfigureAwait(false)) > 0)
            {
                if (written + read > ChunkedUploadLimits.MaxChunkBytes || received + written + read > sizeBytes)
                {
                    file.SetLength(received);
                    return new(ChunkAppendStatus.TooLarge, received);
                }

                await file.WriteAsync(buffer.AsMemory(0, read), ct).ConfigureAwait(false);
                written += read;
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
            await file.FlushAsync(CancellationToken.None).ConfigureAwait(false);
        }

        return new(ChunkAppendStatus.Appended, received + written);
    }

    public async Task<byte[]> ReadHeadAsync(Guid id, int count, CancellationToken ct)
    {
        await using var file = OpenRead(id);
        var head = new byte[Math.Min(count, file.Length)];
        await file.ReadExactlyAsync(head, ct).ConfigureAwait(false);
        return head;
    }

    public FileStream OpenRead(Guid id) =>
        new(PartPath(id), FileMode.Open, FileAccess.Read, FileShare.Read, CopyBufferBytes, useAsync: true);

    public Task SaveResultAsync<T>(Guid id, T result, CancellationToken ct) =>
        File.WriteAllTextAsync(DonePath(id), JsonSerializer.Serialize(result, Json), ct);

    public Task<T?> TryGetResultAsync<T>(Guid id, CancellationToken ct) where T : class =>
        ReadJsonAsync<T>(DonePath(id), ct);

    /// <summary>Drops the received bytes once they are in object storage; the session and result stay for retries.</summary>
    public void DeletePart(Guid id) => File.Delete(PartPath(id));

    public void Delete(Guid id)
    {
        File.Delete(PartPath(id));
        File.Delete(DonePath(id));
        File.Delete(SessionPath(id));
        _locks.TryRemove(id, out _);
    }

    /// <summary>Removes uploads nobody has touched since <paramref name="cutoff"/>. Returns how many.</summary>
    public int DeleteStale(DateTimeOffset cutoff)
    {
        var lastTouched = new Dictionary<Guid, DateTime>();
        foreach (var path in Directory.EnumerateFiles(_root))
        {
            if (!Guid.TryParse(Path.GetFileNameWithoutExtension(path), out var id))
                continue;
            var written = File.GetLastWriteTimeUtc(path);
            if (!lastTouched.TryGetValue(id, out var seen) || written > seen)
                lastTouched[id] = written;
        }

        var removed = 0;
        foreach (var (id, touched) in lastTouched)
        {
            if (touched >= cutoff.UtcDateTime)
                continue;
            Delete(id);
            removed++;
        }
        return removed;
    }

    private async Task<T?> ReadJsonAsync<T>(string path, CancellationToken ct) where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(await File.ReadAllTextAsync(path, ct).ConfigureAwait(false), Json);
        }
        catch (FileNotFoundException)
        {
            return null;
        }
    }

    private string SessionPath(Guid id) => Path.Combine(_root, $"{id:N}.json");
    private string PartPath(Guid id)    => Path.Combine(_root, $"{id:N}.part");
    private string DonePath(Guid id)    => Path.Combine(_root, $"{id:N}.done");

    private sealed class Releaser(SemaphoreSlim gate) : IDisposable
    {
        private int _released;

        public void Dispose()
        {
            if (Interlocked.Exchange(ref _released, 1) == 0)
                gate.Release();
        }
    }
}
