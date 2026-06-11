using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

/// <summary>
/// Root envelope for .inkt project files.
/// Contains a complete snapshot of a project's soul (AiCard) and graph pipeline.
/// </summary>
public sealed class InktProjectDto
{
    [JsonProperty("version")]
    public string Version { get; set; } = "1";

    [JsonProperty("exported_at")]
    public DateTimeOffset ExportedAt { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("soul")]
    public InktSoulDto Soul { get; set; } = new();

    [JsonProperty("graph")]
    public InktGraphDto? Graph { get; set; }
}

public sealed class InktSoulDto
{
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

public sealed class InktGraphDto
{
    [JsonProperty("nodes")]
    public List<object> Nodes { get; set; } = [];

    [JsonProperty("edges")]
    public List<object> Edges { get; set; } = [];
}

public sealed class ImportProjectResponse
{
    [JsonProperty("character_id")]
    public Guid CharacterId { get; set; }
}
