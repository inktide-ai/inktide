using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Soul.Application.Constants;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Collects a model file chunk by chunk on local disk, then stores it and registers it through
/// <see cref="IAiCardModelUploadService.CompleteUploadAsync"/>, the same step presigned uploads end with.
/// </summary>
public sealed class ChunkedModelUploadService : IChunkedModelUploadService
{
    private static readonly TimeSpan LockWait = TimeSpan.FromSeconds(15);

    private readonly IAiCardService _cards;
    private readonly IAiCardModelRepository _models;
    private readonly IObjectStorageService _storage;
    private readonly IAiCardModelUploadService _uploads;
    private readonly ChunkedUploadStore _store;
    private readonly TimeProvider _time;
    private readonly ILogger<ChunkedModelUploadService> _logger;

    public ChunkedModelUploadService(
        IAiCardService cards,
        IAiCardModelRepository models,
        IObjectStorageService storage,
        IAiCardModelUploadService uploads,
        ChunkedUploadStore store,
        TimeProvider time,
        ILogger<ChunkedModelUploadService> logger)
    {
        _cards   = cards   ?? throw new ArgumentNullException(nameof(cards));
        _models  = models  ?? throw new ArgumentNullException(nameof(models));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _uploads = uploads ?? throw new ArgumentNullException(nameof(uploads));
        _store   = store   ?? throw new ArgumentNullException(nameof(store));
        _time    = time    ?? throw new ArgumentNullException(nameof(time));
        _logger  = logger  ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ChunkedUploadSessionResult> StartAsync(
        Guid userId, Guid cardId, string fileName, long sizeBytes, CancellationToken ct = default)
    {
        if (!_storage.IsEnabled)
            return ChunkedUploadSessionResult.Fail(ChunkedUploadError.StorageDisabled, "Object storage is not configured.");

        var constraints = ModelUploadConstraints.Value;
        var validationError = constraints.Validate(fileName, sizeBytes);
        if (validationError is not null)
            return ChunkedUploadSessionResult.Fail(ChunkedUploadError.Validation, validationError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return ChunkedUploadSessionResult.Fail(ChunkedUploadError.CardNotFound, "AI card not found.");

        var existingCount = await _models.CountByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        if (existingCount >= SoulConstants.Upload.MaxModelsPerCard)
            return ChunkedUploadSessionResult.Fail(ChunkedUploadError.Validation,
                $"Model limit reached ({SoulConstants.Upload.MaxModelsPerCard} per card).");

        var session = new ChunkedUploadSession(
            IdGenerator.New(), userId, cardId,
            StorageFileHelper.SanitizeFileName(fileName, constraints.FallbackFileName),
            sizeBytes,
            _time.GetUtcNow());
        await _store.CreateAsync(session, ct).ConfigureAwait(false);

        _logger.LogInformation("Started chunked model upload id={UploadId} card={CardId} size={Size}",
            session.Id, cardId, sizeBytes);
        return ChunkedUploadSessionResult.Ok(ToInfo(session, receivedBytes: 0));
    }

    public async Task<ChunkedUploadSessionResult> GetStatusAsync(
        Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default)
    {
        var session = await FindAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        if (session is null)
            return ChunkedUploadSessionResult.Fail(ChunkedUploadError.UploadNotFound, "Upload not found.");

        var done = await _store.TryGetResultAsync<AiCardModel>(uploadId, ct).ConfigureAwait(false);
        var received = done is null ? _store.GetReceivedBytes(uploadId) : session.SizeBytes;
        return ChunkedUploadSessionResult.Ok(ToInfo(session, received));
    }

    public async Task<AppendChunkResult> AppendAsync(
        Guid userId, Guid cardId, Guid uploadId, long offset, Stream data, CancellationToken ct = default)
    {
        var session = await FindAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        if (session is null)
            return AppendChunkResult.Fail(ChunkedUploadError.UploadNotFound, "Upload not found.");

        if (offset < 0)
            return AppendChunkResult.Fail(ChunkedUploadError.Validation, "offset must not be negative.");

        using var gate = await _store.TryLockAsync(uploadId, LockWait, ct).ConfigureAwait(false);
        if (gate is null)
            return AppendChunkResult.Fail(ChunkedUploadError.Busy, "Upload is busy, retry shortly.",
                _store.GetReceivedBytes(uploadId));

        // Already stored: nothing left to send, the client should call complete.
        if (await _store.TryGetResultAsync<AiCardModel>(uploadId, ct).ConfigureAwait(false) is not null)
            return AppendChunkResult.Fail(ChunkedUploadError.OffsetMismatch, "Upload already complete.", session.SizeBytes);

        var outcome = await _store.AppendAsync(uploadId, offset, data, session.SizeBytes, ct).ConfigureAwait(false);
        return outcome.Status switch
        {
            ChunkAppendStatus.Appended => AppendChunkResult.Ok(outcome.ReceivedBytes),
            ChunkAppendStatus.OffsetMismatch => AppendChunkResult.Fail(ChunkedUploadError.OffsetMismatch,
                $"Expected offset {outcome.ReceivedBytes}.", outcome.ReceivedBytes),
            _ => AppendChunkResult.Fail(ChunkedUploadError.Validation,
                $"Chunk exceeds {ChunkedUploadLimits.MaxChunkBytes} bytes or the declared file size.", outcome.ReceivedBytes),
        };
    }

    public async Task<CompleteChunkedUploadResult> CompleteAsync(
        Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default)
    {
        var session = await FindAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        if (session is null)
            return CompleteChunkedUploadResult.Fail(ChunkedUploadError.UploadNotFound, "Upload not found.");

        using var gate = await _store.TryLockAsync(uploadId, LockWait, ct).ConfigureAwait(false);
        if (gate is null)
            return CompleteChunkedUploadResult.Fail(ChunkedUploadError.Busy, "Upload is busy, retry shortly.");

        // A retry after a dropped response: the model already exists, answer the same way.
        var done = await _store.TryGetResultAsync<AiCardModel>(uploadId, ct).ConfigureAwait(false);
        if (done is not null)
            return CompleteChunkedUploadResult.Ok(done);

        var received = _store.GetReceivedBytes(uploadId);
        if (received != session.SizeBytes)
            return CompleteChunkedUploadResult.Fail(ChunkedUploadError.Incomplete,
                $"Received {received} of {session.SizeBytes} bytes.", received);

        var head = await _store.ReadHeadAsync(uploadId, ModelFileSignature.HeadBytes, ct).ConfigureAwait(false);
        if (!ModelFileSignature.Matches(session.FileName, head))
        {
            _logger.LogWarning("Chunked upload id={UploadId} rejected: content does not match {FileName}",
                uploadId, session.FileName);
            _store.Delete(uploadId);
            return CompleteChunkedUploadResult.Fail(ChunkedUploadError.InvalidFile,
                "File content does not match its extension.");
        }

        var contentType = StorageFileHelper.InferContentType(null, session.FileName, "application/octet-stream");
        var objectKey   = $"users/{userId:N}/cards/{cardId:N}/models/{IdGenerator.New():N}_{session.FileName}";
        await using (var content = _store.OpenRead(uploadId))
        {
            await _storage.PutObjectAsync(objectKey, content, contentType, ct).ConfigureAwait(false);
        }

        var result = await _uploads
            .CompleteUploadAsync(userId, cardId, objectKey, session.FileName, contentType, session.SizeBytes, ct)
            .ConfigureAwait(false);
        if (!result.Success || result.Model is null)
        {
            await DeleteOrphanAsync(objectKey).ConfigureAwait(false);
            return CompleteChunkedUploadResult.Fail(ToChunkedError(result.ErrorKind),
                result.Error ?? "Could not register the model.", received);
        }

        await _store.SaveResultAsync(uploadId, result.Model, ct).ConfigureAwait(false);
        _store.DeletePart(uploadId);

        _logger.LogInformation("Completed chunked model upload id={UploadId} model={ModelId} key={Key}",
            uploadId, result.Model.Id, objectKey);
        return CompleteChunkedUploadResult.Ok(result.Model);
    }

    public async Task<bool> CancelAsync(Guid userId, Guid cardId, Guid uploadId, CancellationToken ct = default)
    {
        var session = await FindAsync(userId, cardId, uploadId, ct).ConfigureAwait(false);
        if (session is null)
            return false;

        using var gate = await _store.TryLockAsync(uploadId, LockWait, ct).ConfigureAwait(false);
        _store.Delete(uploadId);
        return true;
    }

    /// <summary>Upload ids are unguessable, but they still only resolve for the user and card that started them.</summary>
    private async Task<ChunkedUploadSession?> FindAsync(Guid userId, Guid cardId, Guid uploadId, CancellationToken ct)
    {
        var session = await _store.GetAsync(uploadId, ct).ConfigureAwait(false);
        return session is not null && session.UserId == userId && session.CardId == cardId ? session : null;
    }

    private async Task DeleteOrphanAsync(string objectKey)
    {
        try
        {
            await _storage.DeleteObjectAsync(objectKey, CancellationToken.None).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete unregistered model object key={Key}", objectKey);
        }
    }

    private static ChunkedUploadInfo ToInfo(ChunkedUploadSession session, long receivedBytes) =>
        new(session.Id, session.SizeBytes, receivedBytes, ChunkedUploadLimits.ChunkBytes);

    private static ChunkedUploadError ToChunkedError(ModelUploadError kind) => kind switch
    {
        ModelUploadError.StorageDisabled => ChunkedUploadError.StorageDisabled,
        ModelUploadError.CardNotFound    => ChunkedUploadError.CardNotFound,
        _                                => ChunkedUploadError.Validation,
    };
}
