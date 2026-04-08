namespace Chimera.API.Soul.Domain.Entities;

/// <summary>
/// Core aggregate root — one AI companion configuration owned by a user.
/// Contains identity, prompts, and JSONB config blobs for LLM/TTS/behavior/memory/autonomy.
/// </summary>
public sealed class AiCard
{
    #region Fields

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
    private string _visibility = "private";
    private bool _isActive = true;
    private DateTime? _deletedAt;
    private DateTime _createdAt;
    private DateTime _updatedAt;
    private LlmCatalogEntry? _llmCatalog;
    private TtsCatalogEntry? _ttsCatalog;
    private ICollection<AiCardChannel> _channels = [];
    private ICollection<AiCardTool> _tools = [];

    #endregion

    #region Properties

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

    /// <summary>Visibility scope: 'private' | 'unlisted' | 'public'.</summary>
    public string Visibility
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

    #endregion
}
