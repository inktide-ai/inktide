using Newtonsoft.Json;

namespace Inktide.API.Project.REST.Models;

public sealed class ActiveSoulSummaryDto
{
    [JsonProperty("id")]         public Guid    Id        { get; set; }
    [JsonProperty("name")]       public string  Name      { get; set; } = string.Empty;
    [JsonProperty("avatar_url")] public string? AvatarUrl { get; set; }
}

public sealed class ProjectResponse
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("user_id")]
    public Guid UserId { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("active_soul_id")]
    public Guid? ActiveSoulId { get; set; }

    [JsonProperty("active_soul")]
    public ActiveSoulSummaryDto? ActiveSoul { get; set; }

    [JsonProperty("active_model_id")]
    public Guid? ActiveModelId { get; set; }

    [JsonProperty("active_scene_id")]
    public Guid? ActiveSceneId { get; set; }

    [JsonProperty("system_prompt")]
    public string? SystemPrompt { get; set; }

    [JsonProperty("status")]
    public string Status { get; set; } = "active";

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [JsonProperty("sort_key")]
    public string SortKey { get; set; } = "a0";
}

public sealed class ReorderProjectRequest
{
    [JsonProperty("previous_id")] public Guid? PreviousId { get; set; }
    [JsonProperty("next_id")]     public Guid? NextId     { get; set; }
}

public sealed class ProjectPluginResponse
{
    [JsonProperty("plugin_id")]  public string PluginId  { get; set; } = string.Empty;
    [JsonProperty("is_enabled")] public bool   IsEnabled { get; set; }
    [JsonProperty("config")]     public Dictionary<string, string> Config { get; set; } = [];
}

public sealed class UpsertPluginRequest
{
    [JsonProperty("is_enabled")] public bool IsEnabled { get; set; }
    [JsonProperty("config")]     public Dictionary<string, string>? Config { get; set; }
}

public sealed class CreateProjectRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("active_soul_id")]
    public Guid? ActiveSoulId { get; set; }
}

public sealed class UpdateProjectRequest
{
    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("status")]
    public string? Status { get; set; }

    [JsonProperty("active_model_id")]
    public Guid? ActiveModelId { get; set; }

    [JsonProperty("active_scene_id")]
    public Guid? ActiveSceneId { get; set; }

    [JsonProperty("system_prompt")]
    public string? SystemPrompt { get; set; }
}

public sealed class BindSoulRequest
{
    [JsonProperty("soul_id")]
    public Guid SoulId { get; set; }
}

public sealed class ImportProjectResponse
{
    [JsonProperty("project_id")]
    public Guid ProjectId { get; set; }

    [JsonProperty("soul_id")]
    public Guid? SoulId { get; set; }
}

// ── ZIP-based export / two-phase import ──────────────────────────────────────

public sealed class ExportProjectRequest
{
    [JsonProperty("project_id")]
    public Guid ProjectId { get; set; }
}

public sealed class InktFileParseResponse
{
    [JsonProperty("parse_token")]
    public string ParseToken { get; set; } = string.Empty;

    [JsonProperty("project_name")]
    public string ProjectName { get; set; } = string.Empty;

    [JsonProperty("soul_name")]
    public string? SoulName { get; set; }

    [JsonProperty("has_graph")]
    public bool HasGraph { get; set; }

    [JsonProperty("connector_count")]
    public int ConnectorCount { get; set; }

    [JsonProperty("llm_model_id")]
    public string? LlmModelId { get; set; }

    [JsonProperty("llm_provider")]
    public string? LlmProvider { get; set; }

    [JsonProperty("tts_voice_id")]
    public string? TtsVoiceId { get; set; }

    [JsonProperty("tts_provider")]
    public string? TtsProvider { get; set; }

    [JsonProperty("warnings")]
    public List<string> Warnings { get; set; } = [];
}

public sealed class FinalizeImportRequest
{
    [JsonProperty("parse_token")]
    public string ParseToken { get; set; } = string.Empty;

    /// <summary>Null = create new Soul from exported template.</summary>
    [JsonProperty("target_soul_id")]
    public Guid? TargetSoulId { get; set; }

    /// <summary>Default true — connector stubs require re-authentication.</summary>
    [JsonProperty("import_connectors_disabled")]
    public bool? ImportConnectorsDisabled { get; set; }
}

// ── Legacy JSON-based .inkt DTOs (kept for backwards compatibility) ──────────

public sealed class InktProjectDto
{
    [JsonProperty("version")]
    public string Version { get; set; } = "1";

    [JsonProperty("exported_at")]
    public DateTimeOffset ExportedAt { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("soul")]
    public InktSoulDto? Soul { get; set; }

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

    [JsonProperty("personality")]
    public string Personality { get; set; } = string.Empty;

    [JsonProperty("system_prompt")]
    public string SystemPrompt { get; set; } = string.Empty;

    [JsonProperty("llm_catalog_id")]
    public Guid LlmCatalogId { get; set; }

    [JsonProperty("llm_config")]
    public object? LlmConfig { get; set; }

    [JsonProperty("tts_catalog_id")]
    public Guid? TtsCatalogId { get; set; }

    [JsonProperty("tts_config")]
    public object? TtsConfig { get; set; }

    [JsonProperty("appearance")]
    public object? Appearance { get; set; }

    [JsonProperty("response_behavior")]
    public object? ResponseBehavior { get; set; }

    [JsonProperty("memory_settings")]
    public object? MemorySettings { get; set; }

    [JsonProperty("auto_pilot")]
    public object? AutoPilot { get; set; }
}

public sealed class InktGraphDto
{
    [JsonProperty("nodes")]
    public List<object> Nodes { get; set; } = [];

    [JsonProperty("edges")]
    public List<object> Edges { get; set; } = [];
}
