using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;
using AiCardSceneEntity = Chimera.API.Soul.Domain.Entities.AiCardScene;
using AiCardCustomSceneTag = Chimera.API.Soul.Domain.Entities.AiCardCustomSceneTag;

namespace Chimera.API.Soul.Application.Services;

/// <summary>
/// Scene tag management and metadata patching.
/// ISP: extracted from IAiCardSceneUploadService so consumers that only need tag operations
///      do not depend on upload infrastructure (IObjectStorageService, presign URLs, etc.).
/// SRP: tag validation rules (label length, color format) change here, not in the upload service.
/// </summary>
public sealed class AiCardSceneTagService : IAiCardSceneTagService
{
    private readonly IAiCardService _cards;
    private readonly IAiCardSceneRepository _scenes;
    private readonly IAiCardCustomSceneTagRepository _customSceneTags;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardSceneTagService> _logger;

    public AiCardSceneTagService(
        IAiCardService cards,
        IAiCardSceneRepository scenes,
        IAiCardCustomSceneTagRepository customSceneTags,
        TimeProvider time,
        ILogger<AiCardSceneTagService> logger)
    {
        _cards           = cards           ?? throw new ArgumentNullException(nameof(cards));
        _scenes          = scenes          ?? throw new ArgumentNullException(nameof(scenes));
        _customSceneTags = customSceneTags ?? throw new ArgumentNullException(nameof(customSceneTags));
        _time            = time            ?? throw new ArgumentNullException(nameof(time));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<CustomSceneTagRecord>?> ListMergedCustomTagsAsync(
        Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null) return null;

        var fromTable  = await _customSceneTags.ListByCardAsync(userId, cardId, ct).ConfigureAwait(false);
        var fromScenes = await _scenes.ListDistinctTagsByCardAsync(userId, cardId, ct).ConfigureAwait(false);

        var seen   = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var merged = new List<CustomSceneTagRecord>();

        foreach (var (label, color) in fromTable)
            if (seen.Add(label)) merged.Add(new CustomSceneTagRecord(label, color));

        foreach (var label in fromScenes)
            if (seen.Add(label)) merged.Add(new CustomSceneTagRecord(label, null));

        merged.Sort((a, b) => string.Compare(a.Label, b.Label, StringComparison.OrdinalIgnoreCase));
        return merged;
    }

    public async Task<AddCustomSceneTagResult> AddCustomSceneTagAsync(
        Guid userId, Guid cardId, string label, string? color = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(label))
            return AddCustomSceneTagResult.Fail(SceneUploadError.Validation, "label is required.");

        var trimmed = label.Trim();
        if (trimmed.Length > 128)
            return AddCustomSceneTagResult.Fail(SceneUploadError.Validation, "label must be at most 128 characters.");

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return AddCustomSceneTagResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");

        var normalized = trimmed.ToLowerInvariant();
        if (await _customSceneTags.ExistsNormalizedAsync(userId, cardId, normalized, ct).ConfigureAwait(false))
            return AddCustomSceneTagResult.Ok();

        var row = AiCardCustomSceneTag.Create(userId, cardId, trimmed, _time.GetUtcNow().UtcDateTime, color);
        await _customSceneTags.AddAsync(row, ct).ConfigureAwait(false);
        _logger.LogInformation("Added custom scene tag card={CardId} label={Label}", cardId, trimmed);

        return AddCustomSceneTagResult.Ok();
    }

    public async Task<PatchSceneTagResult> PatchSceneTagAsync(
        Guid userId, Guid cardId, Guid sceneId, string? tag, CancellationToken ct = default)
    {
        var tagError = TryNormalizeTag(tag, out var normalizedTag);
        if (tagError is not null)
            return PatchSceneTagResult.Fail(SceneUploadError.Validation, tagError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return PatchSceneTagResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");

        var scene = await _scenes.GetByIdAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);
        if (scene is null)
            return PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.");

        var updated = await _scenes.UpdateTagAsync(userId, cardId, sceneId, normalizedTag, ct).ConfigureAwait(false);
        if (!updated)
            return PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.");

        var refreshed = await _scenes.GetByIdAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);
        return refreshed is null
            ? PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.")
            : PatchSceneTagResult.Ok(ToDto(refreshed));
    }

    public async Task<PatchSceneTagResult> PutSceneMetadataAsync(
        Guid userId, Guid cardId, Guid sceneId,
        string? displayName, string? description, string? tag,
        CancellationToken ct = default)
    {
        var dnErr = TryNormalizeMaxLength(displayName, 200, "display_name", out var normalizedDisplay);
        if (dnErr is not null)
            return PatchSceneTagResult.Fail(SceneUploadError.Validation, dnErr);

        var descErr = TryNormalizeMaxLength(description, 2000, "description", out var normalizedDescription);
        if (descErr is not null)
            return PatchSceneTagResult.Fail(SceneUploadError.Validation, descErr);

        var tagError = TryNormalizeTag(tag, out var normalizedTag);
        if (tagError is not null)
            return PatchSceneTagResult.Fail(SceneUploadError.Validation, tagError);

        var card = await _cards.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null)
            return PatchSceneTagResult.Fail(SceneUploadError.CardNotFound, "AI card not found.");

        var scene = await _scenes.GetByIdAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);
        if (scene is null)
            return PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.");

        var updated = await _scenes
            .UpdateMetadataAsync(userId, cardId, sceneId, normalizedDisplay, normalizedDescription, normalizedTag, ct)
            .ConfigureAwait(false);
        if (!updated)
            return PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.");

        var refreshed = await _scenes.GetByIdAsync(userId, cardId, sceneId, ct).ConfigureAwait(false);
        return refreshed is null
            ? PatchSceneTagResult.Fail(SceneUploadError.SceneNotFound, "Scene not found.")
            : PatchSceneTagResult.Ok(ToDto(refreshed));
    }


    private static AiCardScene ToDto(AiCardSceneEntity s) =>
        new(s.Id, s.AiCardId, s.StorageKey, s.PublicUrl, s.OriginalFileName,
            s.ContentType, s.SizeBytes, s.CreatedAt, s.Tag, s.DisplayName, s.Description);

    /// <summary>Validates a scene tag (max 128 chars, nullable = clear). Returns null on success.</summary>
    private static string? TryNormalizeTag(string? tag, out string? normalized)
    {
        normalized = null;
        if (tag is null || string.IsNullOrWhiteSpace(tag)) return null;
        var t = tag.Trim();
        if (t.Length > 128) return "tag must be at most 128 characters.";
        normalized = t;
        return null;
    }

    /// <summary>Validates an optional string field with a maximum character limit. Returns null on success.</summary>
    private static string? TryNormalizeMaxLength(string? value, int maxLength, string fieldName, out string? normalized)
    {
        normalized = null;
        if (value is null || string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (v.Length == 0) return null;
        if (v.Length > maxLength) return $"{fieldName} must be at most {maxLength} characters.";
        normalized = v;
        return null;
    }
}
