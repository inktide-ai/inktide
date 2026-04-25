namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Scene tag management and metadata patching — separated from upload concerns.
/// ISP: a background tag-cleanup job depends only on this interface, not on upload infrastructure.
/// SRP: tag rules (label length, colour format) change independently from upload validation.
/// </summary>
public interface IAiCardSceneTagService
{
    /// <summary>Returns null when the AI card does not exist or is not visible to the user.</summary>
    Task<IReadOnlyList<CustomSceneTagRecord>?> ListMergedCustomTagsAsync(
        Guid userId, Guid cardId, CancellationToken ct = default);

    Task<AddCustomSceneTagResult> AddCustomSceneTagAsync(
        Guid userId, Guid cardId, string label, string? color = null, CancellationToken ct = default);

    Task<PatchSceneTagResult> PatchSceneTagAsync(
        Guid userId, Guid cardId, Guid sceneId, string? tag, CancellationToken ct = default);

    Task<PatchSceneTagResult> PutSceneMetadataAsync(
        Guid userId, Guid cardId, Guid sceneId,
        string? displayName, string? description, string? tag,
        CancellationToken ct = default);
}
