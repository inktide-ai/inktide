using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class AiCardResponse
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonProperty("description")]
    public string Description { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = "active";

    [JsonProperty("cover_url")]
    public string? CoverUrl { get; set; }

    [JsonProperty("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonProperty("personality")]
    public string Personality { get; set; } = string.Empty;

    [JsonProperty("system_prompt")]
    public string SystemPrompt { get; set; } = string.Empty;

    [JsonProperty("llm_catalog_id")]
    public Guid LlmCatalogId { get; set; }

    [JsonProperty("llm_config")]
    public AiCardLlmConfigDto? LlmConfig { get; set; }

    [JsonProperty("llm_model")]
    public LlmModelResponse? LlmModel { get; set; }

    [JsonProperty("tts_catalog_id")]
    public Guid? TtsCatalogId { get; set; }

    [JsonProperty("tts_config")]
    public AiCardTtsConfigDto? TtsConfig { get; set; }

    [JsonProperty("tts_voice")]
    public TtsVoiceResponse? TtsVoice { get; set; }

    [JsonProperty("appearance")]
    public AiCardAppearanceDto? Appearance { get; set; }

    [JsonProperty("response_behavior")]
    public AiCardBehaviorDto? ResponseBehavior { get; set; }

    [JsonProperty("memory_settings")]
    public AiCardMemoryDto? MemorySettings { get; set; }

    [JsonProperty("auto_pilot")]
    public AiCardAutoPilotDto? AutoPilot { get; set; }

    [JsonProperty("screen_awareness")]
    public AiCardScreenAwarenessDto? ScreenAwareness { get; set; }

    [JsonProperty("personality_config")]
    public AiCardPersonalityDto? PersonalityConfig { get; set; }

    [JsonProperty("visibility")]
    public string Visibility { get; set; } = "private";

    [JsonProperty("channels")]
    public IReadOnlyList<ChannelResponse>? Channels { get; set; }

    [JsonProperty("tools")]
    public IReadOnlyList<ToolResponse>? Tools { get; set; }

    [JsonProperty("is_active")]
    public bool IsActive { get; set; }

    [JsonProperty("category")]
    public string? Category { get; set; }

    [JsonProperty("tags")]
    public IReadOnlyList<string> Tags { get; set; } = [];

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

public sealed class AiCardListItem
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonProperty("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonProperty("personality")]
    public string Personality { get; set; } = string.Empty;

    [JsonProperty("llm_model")]
    public string? LlmModelName { get; set; }

    [JsonProperty("description")]
    public string Description { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = "active";

    [JsonProperty("cover_url")]
    public string? CoverUrl { get; set; }

    [JsonProperty("platforms")]
    public IReadOnlyList<string> Platforms { get; set; } = [];

    [JsonProperty("is_active")]
    public bool IsActive { get; set; }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [JsonProperty("sort_key")]
    public string SortKey { get; set; } = "a0";
}
