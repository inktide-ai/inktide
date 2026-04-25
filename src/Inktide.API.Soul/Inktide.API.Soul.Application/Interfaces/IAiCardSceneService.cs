namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Upload, list, and delete background scene images.
/// ISP: consumers that only need upload concerns do not depend on tag-management methods.
/// </summary>
public interface IAiCardSceneService
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

    /// <summary>Returns null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<AiCardScene>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    Task<DeleteSceneResult> DeleteAsync(Guid userId, Guid cardId, Guid sceneId, CancellationToken ct = default);
}
