using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class CreateAiCardRequest
{

    private string _name = string.Empty;
    private string? _personality;
    private string _systemPrompt = string.Empty;
    private string? _avatarUrl;
    private Guid _llmCatalogId;
    private object? _llmConfig;
    private Guid? _ttsCatalogId;
    private object? _ttsConfig;
    private object? _appearance;
    private object? _responseBehavior;
    private object? _memorySettings;
    private object? _autoPilot;


    [JsonProperty("name")]
    public string Name
    {
        get => _name;
        set => _name = value;
    }

    [JsonProperty("personality")]
    public string? Personality
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

    [JsonProperty("avatar_url")]
    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => _avatarUrl = value;
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

}

public sealed class UpdateAiCardRequest
{

    private string? _name;
    private string? _slug;
    private string? _personality;
    private string? _systemPrompt;
    private string? _avatarUrl;
    private Guid? _llmCatalogId;
    private object? _llmConfig;
    private Guid? _ttsCatalogId;
    private object? _ttsConfig;
    private object? _appearance;
    private object? _responseBehavior;
    private object? _memorySettings;
    private object? _autoPilot;
    private bool? _isActive;
    private string? _visibility;


    [JsonProperty("name")]
    public string? Name
    {
        get => _name;
        set => _name = value;
    }

    [JsonProperty("slug")]
    public string? Slug
    {
        get => _slug;
        set => _slug = value;
    }

    [JsonProperty("personality")]
    public string? Personality
    {
        get => _personality;
        set => _personality = value;
    }

    [JsonProperty("system_prompt")]
    public string? SystemPrompt
    {
        get => _systemPrompt;
        set => _systemPrompt = value;
    }

    [JsonProperty("avatar_url")]
    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => _avatarUrl = value;
    }

    [JsonProperty("llm_catalog_id")]
    public Guid? LlmCatalogId
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

    [JsonProperty("is_active")]
    public bool? IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    [JsonProperty("visibility")]
    public string? Visibility
    {
        get => _visibility;
        set => _visibility = value;
    }

}
