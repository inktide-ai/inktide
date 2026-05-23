using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class CreateAiCardRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("personality")]
    public string? Personality { get; set; }

    [JsonProperty("system_prompt")]
    public string SystemPrompt { get; set; } = string.Empty;

    [JsonProperty("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonProperty("llm_catalog_id")]
    public Guid LlmCatalogId { get; set; }

    [JsonProperty("llm_config")]
    public AiCardLlmConfigDto? LlmConfig { get; set; }

    [JsonProperty("tts_catalog_id")]
    public Guid? TtsCatalogId { get; set; }

    [JsonProperty("tts_config")]
    public AiCardTtsConfigDto? TtsConfig { get; set; }

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
}

public sealed class UpdateAiCardRequest
{
    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("slug")]
    public string? Slug { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("status")]
    public string? Status { get; set; }

    [JsonProperty("cover_url")]
    public string? CoverUrl { get; set; }

    [JsonProperty("personality")]
    public string? Personality { get; set; }

    [JsonProperty("system_prompt")]
    public string? SystemPrompt { get; set; }

    [JsonProperty("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonProperty("llm_catalog_id")]
    public Guid? LlmCatalogId { get; set; }

    [JsonProperty("llm_config")]
    public AiCardLlmConfigDto? LlmConfig { get; set; }

    [JsonProperty("tts_catalog_id")]
    public Guid? TtsCatalogId { get; set; }

    [JsonProperty("tts_config")]
    public AiCardTtsConfigDto? TtsConfig { get; set; }

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

    [JsonProperty("is_active")]
    public bool? IsActive { get; set; }

    [JsonProperty("visibility")]
    public string? Visibility { get; set; }
}

public sealed class ReorderCardRequest
{
    [JsonProperty("previous_id")] public Guid? PreviousId { get; set; }
    [JsonProperty("next_id")]     public Guid? NextId     { get; set; }
}
