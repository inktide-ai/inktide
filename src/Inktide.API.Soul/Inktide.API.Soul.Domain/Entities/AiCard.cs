using Inktide.API.Soul.Domain.Enums;

namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Core aggregate root — thin soul identity: name, LLM/TTS provider selection, and 3D models.
/// Behavior config (system prompt, personality, response behavior, memory, autopilot, screen awareness)
/// has moved to the Project context.
/// </summary>
public sealed class AiCard
{

    private Guid _id;
    private Guid _userId;
    private string _name = string.Empty;
    private string _slug = string.Empty;
    private string? _avatarUrl;
    private string? _bannerUrl;
    private Guid _llmCatalogId;
    private string _llmConfig = "{}";
    private Guid? _ttsCatalogId;
    private string? _ttsConfig;
    private string _appearance = "{}";
    private string _description = string.Empty;
    private AiCardStatus _status = AiCardStatus.Active;
    private string? _coverUrl;
    private AiCardVisibility _visibility = AiCardVisibility.Private;
    private bool _isActive = true;
    private DateTime? _deletedAt;
    private DateTime _createdAt;
    private DateTime _updatedAt;
    private string _sortKey = "a0";
    private LlmCatalogEntry? _llmCatalog;
    private TtsCatalogEntry? _ttsCatalog;
    private string? _category;
    private string _tags = "[]";


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid UserId
    {
        get => _userId;
        set => _userId = value;
    }

    public string Name
    {
        get => _name;
        set => _name = value;
    }

    public string Slug
    {
        get => _slug;
        set => _slug = value;
    }

    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => _avatarUrl = value;
    }

    public string? BannerUrl
    {
        get => _bannerUrl;
        set => _bannerUrl = value;
    }

    /// <summary>FK to <see cref="LlmCatalogEntry"/>.</summary>
    public Guid LlmCatalogId
    {
        get => _llmCatalogId;
        set => _llmCatalogId = value;
    }

    /// <summary>Provider-specific LLM parameters (temperature, max_tokens, top_p, etc.).</summary>
    public string LlmConfig
    {
        get => _llmConfig;
        set => _llmConfig = value;
    }

    /// <summary>FK to <see cref="TtsCatalogEntry"/>. Null = TTS disabled.</summary>
    public Guid? TtsCatalogId
    {
        get => _ttsCatalogId;
        set => _ttsCatalogId = value;
    }

    /// <summary>Provider-specific TTS parameters (speed, pitch, stability, etc.).</summary>
    public string? TtsConfig
    {
        get => _ttsConfig;
        set => _ttsConfig = value;
    }

    /// <summary>Visual/presentational settings: banner_color_index, model_type, model_file_name.</summary>
    public string Appearance
    {
        get => _appearance;
        set => _appearance = value;
    }

    /// <summary>Short project description shown on the project card.</summary>
    public string Description
    {
        get => _description;
        set => _description = value;
    }

    public AiCardStatus Status
    {
        get => _status;
        set => _status = value;
    }

    /// <summary>URL of the cover image shown on the project card.</summary>
    public string? CoverUrl
    {
        get => _coverUrl;
        set => _coverUrl = value;
    }

    public AiCardVisibility Visibility
    {
        get => _visibility;
        set => _visibility = value;
    }

    /// <summary>Whether the card is enabled/running (not the same as deleted).</summary>
    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    /// <summary>Soft-delete timestamp. NULL = not deleted.</summary>
    public DateTime? DeletedAt
    {
        get => _deletedAt;
        set => _deletedAt = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

    /// <summary>Fractional index key for drag-and-drop ordering. Sorts lexicographically ASC.</summary>
    public string SortKey
    {
        get => _sortKey;
        set => _sortKey = value;
    }

    public void SetSortKey(string key)
    {
        if (string.IsNullOrEmpty(key)) throw new ArgumentException("sort key required", nameof(key));
        _sortKey = key;
    }

    /// <summary>Marks the card as soft-deleted. Throws if already deleted.</summary>
    public void SoftDelete(DateTime now)
    {
        if (_deletedAt.HasValue)
            throw new InvalidOperationException($"AiCard {_id} is already deleted.");
        _deletedAt  = now;
        _updatedAt  = now;
        _isActive   = false;
    }

    /// <summary>Transitions the run status. Throws if the card is deleted.</summary>
    public void ChangeStatus(bool isActive, AiCardStatus status, DateTime now)
    {
        if (_deletedAt.HasValue)
            throw new InvalidOperationException($"Cannot change status of deleted AiCard {_id}.");
        _isActive  = isActive;
        _status    = status;
        _updatedAt = now;
    }

    /// <summary>Updates the in-memory avatar URL (actual DB write uses SetAvatarUrlAsync).</summary>
    public void SetAvatar(string? url) => _avatarUrl = url;

    /// <summary>Updates the in-memory banner URL (actual DB write uses SetBannerUrlAsync).</summary>
    public void SetBanner(string? url) => _bannerUrl = url;

    public string? Category
    {
        get => _category;
        set => _category = value;
    }

    /// <summary>JSON-serialized string array of user-defined tags.</summary>
    public string Tags
    {
        get => _tags;
        set => _tags = value;
    }

    public LlmCatalogEntry? LlmCatalog
    {
        get => _llmCatalog;
        set => _llmCatalog = value;
    }

    public TtsCatalogEntry? TtsCatalog
    {
        get => _ttsCatalog;
        set => _ttsCatalog = value;
    }

}
