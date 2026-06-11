using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class CreateAiCardRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

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

    [JsonProperty("is_active")]
    public bool? IsActive { get; set; }

    [JsonProperty("visibility")]
    public string? Visibility { get; set; }

    [JsonProperty("category")]
    public string? Category { get; set; }

    [JsonProperty("tags")]
    public IReadOnlyList<string>? Tags { get; set; }
}

public sealed class ReorderCardRequest
{
    [JsonProperty("previous_id")] public Guid? PreviousId { get; set; }
    [JsonProperty("next_id")]     public Guid? NextId     { get; set; }
}

public sealed class ChangeCardStatusRequest
{
    /// <summary>"start" | "pause" | "stop"</summary>
    [JsonProperty("action")] public string Action { get; set; } = string.Empty;
}
