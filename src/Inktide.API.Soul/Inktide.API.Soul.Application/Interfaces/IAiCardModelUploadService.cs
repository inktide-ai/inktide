namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardModelUploadService
{
    Task<BeginModelUploadResult> BeginUploadAsync(
        Guid userId,
        Guid cardId,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default);

    Task<CompleteModelUploadResult> CompleteUploadAsync(
        Guid userId,
        Guid cardId,
        string storageKey,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default);

    /// <summary>Null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<AiCardModel>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    Task<DeleteModelResult> DeleteAsync(Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default);

    Task<SetActiveModelResult> SetActiveAsync(Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default);

    Task<PresignThumbnailResult> PresignThumbnailAsync(Guid userId, Guid cardId, Guid modelId, CancellationToken ct = default);

    Task<SaveThumbnailResult> SaveThumbnailAsync(Guid userId, Guid cardId, Guid modelId, string publicUrl, CancellationToken ct = default);
}

public enum ModelUploadError
{
    None,
    StorageDisabled,
    CardNotFound,
    Validation,
    ObjectNotFoundInStorage,
    SizeMismatch,
    ModelNotFound,
}

public sealed record BeginModelUploadResult(
    bool Success,
    ModelUploadError ErrorKind,
    string? UploadUrl,
    string? StorageKey,
    DateTimeOffset ExpiresAt,
    string? RequiredContentType,
    string? Error)
{
    public static BeginModelUploadResult Ok(string uploadUrl, string storageKey, DateTimeOffset expiresAt, string contentType)
        => new(true, ModelUploadError.None, uploadUrl, storageKey, expiresAt, contentType, null);

    public static BeginModelUploadResult Fail(ModelUploadError kind, string error)
        => new(false, kind, null, null, default, null, error);
}

public sealed record CompleteModelUploadResult(
    bool Success,
    ModelUploadError ErrorKind,
    AiCardModel? Model,
    string? Error)
{
    public static CompleteModelUploadResult Ok(AiCardModel model)
        => new(true, ModelUploadError.None, model, null);

    public static CompleteModelUploadResult Fail(ModelUploadError kind, string error)
        => new(false, kind, null, error);
}

public sealed record DeleteModelResult(
    bool Success,
    ModelUploadError ErrorKind,
    string? Error)
{
    public static DeleteModelResult Ok() => new(true, ModelUploadError.None, null);
    public static DeleteModelResult Fail(ModelUploadError kind, string error) => new(false, kind, error);
}

public sealed record SetActiveModelResult(
    bool Success,
    ModelUploadError ErrorKind,
    string? Error)
{
    public static SetActiveModelResult Ok() => new(true, ModelUploadError.None, null);
    public static SetActiveModelResult Fail(ModelUploadError kind, string error) => new(false, kind, error);
}

public sealed record AiCardModel(
    Guid Id,
    Guid AiCardId,
    string StorageKey,
    string PublicUrl,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAt,
    bool IsActive,
    string? ThumbnailUrl = null);

public sealed record PresignThumbnailResult(
    bool Success,
    ModelUploadError ErrorKind,
    string? UploadUrl,
    string? PublicUrl,
    string? Error)
{
    public static PresignThumbnailResult Ok(string uploadUrl, string publicUrl)
        => new(true, ModelUploadError.None, uploadUrl, publicUrl, null);

    public static PresignThumbnailResult Fail(ModelUploadError kind, string error)
        => new(false, kind, null, null, error);
}

public sealed record SaveThumbnailResult(
    bool Success,
    ModelUploadError ErrorKind,
    string? Error)
{
    public static SaveThumbnailResult Ok() => new(true, ModelUploadError.None, null);
    public static SaveThumbnailResult Fail(ModelUploadError kind, string error) => new(false, kind, error);
}
