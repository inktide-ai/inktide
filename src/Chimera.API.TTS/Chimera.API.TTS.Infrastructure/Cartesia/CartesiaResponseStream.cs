namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Wraps the content stream from a Cartesia HTTP response and owns the
/// <see cref="HttpResponseMessage"/> lifetime. Disposing this stream also
/// disposes the response, returning the connection to the pool.
/// </summary>
internal sealed class CartesiaResponseStream : Stream
{

    private readonly Stream _inner;
    private readonly HttpResponseMessage _response;
    private bool _disposed;


    internal CartesiaResponseStream(Stream inner, HttpResponseMessage response)
    {
        _inner    = inner;
        _response = response;
    }


    protected override void Dispose(bool disposing)
    {
        if (_disposed) return;
        _disposed = true;
        if (disposing)
        {
            _inner.Dispose();
            _response.Dispose();
        }
        base.Dispose(disposing);
    }

    public override async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        await _inner.DisposeAsync().ConfigureAwait(false);
        _response.Dispose();
    }


    public override bool CanRead  => _inner.CanRead;
    public override bool CanSeek  => _inner.CanSeek;
    public override bool CanWrite => _inner.CanWrite;
    public override long Length   => _inner.Length;

    public override long Position
    {
        get => _inner.Position;
        set => _inner.Position = value;
    }

    public override void Flush() => _inner.Flush();

    public override Task FlushAsync(CancellationToken ct) => _inner.FlushAsync(ct);

    public override int Read(byte[] buffer, int offset, int count)
        => _inner.Read(buffer, offset, count);

    public override int Read(Span<byte> buffer)
        => _inner.Read(buffer);

    public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken ct)
        => _inner.ReadAsync(buffer, offset, count, ct);

    public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
        => _inner.ReadAsync(buffer, ct);

    public override long Seek(long offset, SeekOrigin origin)
        => _inner.Seek(offset, origin);

    public override void SetLength(long value) => _inner.SetLength(value);

    public override void Write(byte[] buffer, int offset, int count)
        => _inner.Write(buffer, offset, count);

}
