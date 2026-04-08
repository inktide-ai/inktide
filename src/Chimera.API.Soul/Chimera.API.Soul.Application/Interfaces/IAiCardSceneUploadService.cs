namespace Chimera.API.Soul.Application.Interfaces;

public interface IAiCardSceneUploadService
{
    Task<BeginSceneUploadResult> BeginUploadAsync(
        Guid userId,
        Guid cardId,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default);

    Task<CompleteSceneUploadResult> CompleteUploadAsync(
        Guid userId,
        Guid cardId,
        string storageKey,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default);

    /// <summary>Null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<AiCardSceneDto>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    Task<DeleteSceneResult> DeleteAsync(Guid userId, Guid cardId, Guid sceneId, CancellationToken ct = default);
}

public enum SceneUploadError
{
    None,
    StorageDisabled,
    CardNotFound,
    Validation,
    ObjectNotFoundInStorage,
    SizeMismatch,
    SceneNotFound,
}

public sealed record BeginSceneUploadResult(
    bool Success,
    SceneUploadError ErrorKind,
    string? UploadUrl,
    string? StorageKey,
    DateTimeOffset ExpiresAt,
    string? RequiredContentType,
    string? Error)
{
    public static BeginSceneUploadResult Ok(string uploadUrl, string storageKey, DateTimeOffset expiresAt, string contentType)
        => new(true, SceneUploadError.None, uploadUrl, storageKey, expiresAt, contentType, null);

    public static BeginSceneUploadResult Fail(SceneUploadError kind, string error)
        => new(false, kind, null, null, default, null, error);
}

public sealed record CompleteSceneUploadResult(
    bool Success,
    SceneUploadError ErrorKind,
    AiCardSceneDto? Scene,
    string? Error)
{
    public static CompleteSceneUploadResult Ok(AiCardSceneDto scene)
        => new(true, SceneUploadError.None, scene, null);

    public static CompleteSceneUploadResult Fail(SceneUploadError kind, string error)
        => new(false, kind, null, error);
}

public sealed record DeleteSceneResult(
    bool Success,
    SceneUploadError ErrorKind,
    string? Error)
{
    public static DeleteSceneResult Ok() => new(true, SceneUploadError.None, null);
    public static DeleteSceneResult Fail(SceneUploadError kind, string error) => new(false, kind, error);
}

public sealed record AiCardSceneDto(
    Guid Id,
    Guid AiCardId,
    string StorageKey,
    string PublicUrl,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAt);
