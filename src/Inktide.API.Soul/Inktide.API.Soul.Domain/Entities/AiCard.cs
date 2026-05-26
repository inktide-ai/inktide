using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Domain.ValueObjects;

namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Core aggregate root — one AI companion configuration owned by a user.
/// Contains identity, prompts, and JSONB config blobs for LLM/TTS/behavior/memory/autonomy.
/// </summary>
public sealed class AiCard
{

    private Guid _id;
    private Guid _userId;
    private string _name = string.Empty;
    private string _slug = string.Empty;
    private string? _avatarUrl;
    private string _personality = string.Empty;
    private string _systemPrompt = string.Empty;
    private Guid _llmCatalogId;
    private string _llmConfig = "{}";
    private Guid? _ttsCatalogId;
    private string? _ttsConfig;
    private string _appearance = "{}";
    private string _responseBehavior = "{}";
    private string _memorySettings = "{}";
    private string _autoPilot = "{}";
    private string _screenAwarenessSettings = "{}";
    private PersonalitySettings _personalityConfig = new();
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
    private ICollection<AiCardChannel> _channels = [];
    private ICollection<AiCardTool> _tools = [];


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

    public string Personality
    {
        get => _personality;
        set => _personality = value;
    }

    public string SystemPrompt
    {
        get => _systemPrompt;
        set => _systemPrompt = value;
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

    /// <summary>Runtime response knobs: response_delay_ms, max_response_length, language, key_phrases, etc.</summary>
    public string ResponseBehavior
    {
        get => _responseBehavior;
        set => _responseBehavior = value;
    }

    /// <summary>Memory settings: enabled, max_memories, retention_days, importance_threshold.</summary>
    public string MemorySettings
    {
        get => _memorySettings;
        set => _memorySettings = value;
    }

    /// <summary>Auto-pilot config: idle_timeout, min_interval, mood defaults.</summary>
    public string AutoPilot
    {
        get => _autoPilot;
        set => _autoPilot = value;
    }

    /// <summary>Screen awareness config: enabled, hourly_budget_override, phash_threshold.</summary>
    public string ScreenAwarenessSettings
    {
        get => _screenAwarenessSettings;
        set => _screenAwarenessSettings = value;
    }

    /// <summary>Structured personality traits and emotional dynamics (warmth, playfulness, volatility, etc.).</summary>
    public PersonalitySettings PersonalityConfig
    {
        get => _personalityConfig;
        set => _personalityConfig = value;
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

    public ICollection<AiCardChannel> Channels
    {
        get => _channels;
        set => _channels = value;
    }

    public ICollection<AiCardTool> Tools
    {
        get => _tools;
        set => _tools = value;
    }

}
