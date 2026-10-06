namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Resumable model uploads: the file arrives in small chunks through the API, so a connection
/// that drops (flaky mobile data, VPN tunnels that cut long transfers) only costs one chunk.
/// Once complete, the file goes to object storage and is registered like a presigned upload.
/// </summary>
public interface IChunkedModelUploadService
{
    Task<ChunkedUploadSessionResult> StartAsync(
        Guid userId, Guid cardId, string fileName, long sizeBytes, CancellationToken ct = default);

    Task<ChunkedUploadSessionResult> GetStatusAsync(
        Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default);

    Task<AppendChunkResult> AppendAsync(
        Guid userId, Guid cardId, Guid uploadId, long offset, Stream data, CancellationToken ct = default);

    Task<CompleteChunkedUploadResult> CompleteAsync(
        Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default);

    /// <summary>False when there is no such upload for this user and card.</summary>
    Task<bool> CancelAsync(Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default);
}

public enum ChunkedUploadError
{
    None,
    StorageDisabled,
    CardNotFound,
    UploadNotFound,
    Validation,
    /// <summary>The client's offset differs from what the server holds; it should continue from ReceivedBytes.</summary>
    OffsetMismatch,
    /// <summary>Another request is still writing this upload.</summary>
    Busy,
    /// <summary>Complete was called before all bytes arrived.</summary>
    Incomplete,
    /// <summary>The bytes don't look like the file type the name claims.</summary>
    InvalidFile,
}

public sealed record ChunkedUploadInfo(Guid UploadId, long SizeBytes, long ReceivedBytes, int ChunkBytes);

public sealed record ChunkedUploadSessionResult(
    bool Success,
    ChunkedUploadError ErrorKind,
    ChunkedUploadInfo? Upload,
    string? Error)
{
    public static ChunkedUploadSessionResult Ok(ChunkedUploadInfo upload)
        => new(true, ChunkedUploadError.None, upload, null);

    public static ChunkedUploadSessionResult Fail(ChunkedUploadError kind, string error)
        => new(false, kind, null, error);
}

public sealed record AppendChunkResult(
    bool Success,
    ChunkedUploadError ErrorKind,
    long ReceivedBytes,
    string? Error)
{
    public static AppendChunkResult Ok(long receivedBytes)
        => new(true, ChunkedUploadError.None, receivedBytes, null);

    public static AppendChunkResult Fail(ChunkedUploadError kind, string error, long receivedBytes = 0)
        => new(false, kind, receivedBytes, error);
}

public sealed record CompleteChunkedUploadResult(
    bool Success,
    ChunkedUploadError ErrorKind,
    AiCardModel? Model,
    long ReceivedBytes,
    string? Error)
{
    public static CompleteChunkedUploadResult Ok(AiCardModel model)
        => new(true, ChunkedUploadError.None, model, model.SizeBytes, null);

    public static CompleteChunkedUploadResult Fail(ChunkedUploadError kind, string error, long receivedBytes = 0)
        => new(false, kind, null, receivedBytes, error);
}
