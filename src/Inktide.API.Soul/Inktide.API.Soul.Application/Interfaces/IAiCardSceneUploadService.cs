namespace Inktide.API.Soul.Application.Interfaces;

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
        string? tag = null,
        CancellationToken ct = default);

    /// <summary>Null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<AiCardScene>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    /// <summary>Null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<CustomSceneTagRecord>?> ListMergedCustomTagsAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    Task<AddCustomSceneTagResult> AddCustomSceneTagAsync(Guid userId, Guid cardId, string label, string? color = null, CancellationToken ct = default);

    Task<PatchSceneTagResult> PatchSceneTagAsync(Guid userId, Guid cardId, Guid sceneId, string? tag, CancellationToken ct = default);

    Task<PatchSceneTagResult> PutSceneMetadataAsync(
        Guid userId,
        Guid cardId,
        Guid sceneId,
        string? displayName,
        string? description,
        string? tag,
        CancellationToken ct = default);

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
    AiCardScene? Scene,
    string? Error)
{
    public static CompleteSceneUploadResult Ok(AiCardScene scene)
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

public sealed record PatchSceneTagResult(
    bool Success,
    SceneUploadError ErrorKind,
    AiCardScene? Scene,
    string? Error)
{
    public static PatchSceneTagResult Ok(AiCardScene scene)
        => new(true, SceneUploadError.None, scene, null);

    public static PatchSceneTagResult Fail(SceneUploadError kind, string error)
        => new(false, kind, null, error);
}

public sealed record AddCustomSceneTagResult(
    bool Success,
    SceneUploadError ErrorKind,
    string? Error)
{
    public static AddCustomSceneTagResult Ok() => new(true, SceneUploadError.None, null);
    public static AddCustomSceneTagResult Fail(SceneUploadError kind, string error) => new(false, kind, error);
}

/// <summary>Custom scene tag with optional user-chosen color.</summary>
public sealed record CustomSceneTagRecord(string Label, string? Color);

public sealed record AiCardScene(
    Guid Id,
    Guid AiCardId,
    string StorageKey,
    string PublicUrl,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAt,
    string? Tag,
    string? DisplayName,
    string? Description);
