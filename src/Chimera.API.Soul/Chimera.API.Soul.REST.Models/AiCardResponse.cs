using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class AiCardResponse
{

    private Guid _id;
    private string _name = string.Empty;
    private string _slug = string.Empty;
    private string? _avatarUrl;
    private string _personality = string.Empty;
    private string _systemPrompt = string.Empty;
    private Guid _llmCatalogId;
    private object? _llmConfig;
    private LlmModelResponse? _llmModel;
    private Guid? _ttsCatalogId;
    private object? _ttsConfig;
    private TtsVoiceResponse? _ttsVoice;
    private object? _appearance;
    private object? _responseBehavior;
    private object? _memorySettings;
    private object? _autoPilot;
    private string _visibility = "private";
    private IReadOnlyList<ChannelResponse>? _channels;
    private IReadOnlyList<ToolResponse>? _tools;
    private bool _isActive;
    private DateTime _createdAt;
    private DateTime _updatedAt;


    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("name")]
    public string Name
    {
        get => _name;
        set => _name = value;
    }

    [JsonProperty("slug")]
    public string Slug
    {
        get => _slug;
        set => _slug = value;
    }

    [JsonProperty("avatar_url")]
    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => _avatarUrl = value;
    }

    [JsonProperty("personality")]
    public string Personality
    {
        get => _personality;
        set => _personality = value;
    }

    [JsonProperty("system_prompt")]
    public string SystemPrompt
    {
        get => _systemPrompt;
        set => _systemPrompt = value;
    }

    [JsonProperty("llm_catalog_id")]
    public Guid LlmCatalogId
    {
        get => _llmCatalogId;
        set => _llmCatalogId = value;
    }

    [JsonProperty("llm_config")]
    public object? LlmConfig
    {
        get => _llmConfig;
        set => _llmConfig = value;
    }

    [JsonProperty("llm_model")]
    public LlmModelResponse? LlmModel
    {
        get => _llmModel;
        set => _llmModel = value;
    }

    [JsonProperty("tts_catalog_id")]
    public Guid? TtsCatalogId
    {
        get => _ttsCatalogId;
        set => _ttsCatalogId = value;
    }

    [JsonProperty("tts_config")]
    public object? TtsConfig
    {
        get => _ttsConfig;
        set => _ttsConfig = value;
    }

    [JsonProperty("tts_voice")]
    public TtsVoiceResponse? TtsVoice
    {
        get => _ttsVoice;
        set => _ttsVoice = value;
    }

    [JsonProperty("appearance")]
    public object? Appearance
    {
        get => _appearance;
        set => _appearance = value;
    }

    [JsonProperty("response_behavior")]
    public object? ResponseBehavior
    {
        get => _responseBehavior;
        set => _responseBehavior = value;
    }

    [JsonProperty("memory_settings")]
    public object? MemorySettings
    {
        get => _memorySettings;
        set => _memorySettings = value;
    }

    [JsonProperty("auto_pilot")]
    public object? AutoPilot
    {
        get => _autoPilot;
        set => _autoPilot = value;
    }

    [JsonProperty("visibility")]
    public string Visibility
    {
        get => _visibility;
        set => _visibility = value;
    }

    [JsonProperty("channels")]
    public IReadOnlyList<ChannelResponse>? Channels
    {
        get => _channels;
        set => _channels = value;
    }

    [JsonProperty("tools")]
    public IReadOnlyList<ToolResponse>? Tools
    {
        get => _tools;
        set => _tools = value;
    }

    [JsonProperty("is_active")]
    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    [JsonProperty("created_at")]
    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

}

public sealed class AiCardListItem
{

    private Guid _id;
    private string _name = string.Empty;
    private string _slug = string.Empty;
    private string? _avatarUrl;
    private string _personality = string.Empty;
    private string? _llmModelName;
    private bool _isActive;
    private DateTime _updatedAt;


    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("name")]
    public string Name
    {
        get => _name;
        set => _name = value;
    }

    [JsonProperty("slug")]
    public string Slug
    {
        get => _slug;
        set => _slug = value;
    }

    [JsonProperty("avatar_url")]
    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => _avatarUrl = value;
    }

    [JsonProperty("personality")]
    public string Personality
    {
        get => _personality;
        set => _personality = value;
    }

    [JsonProperty("llm_model")]
    public string? LlmModelName
    {
        get => _llmModelName;
        set => _llmModelName = value;
    }

    [JsonProperty("is_active")]
    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

}
