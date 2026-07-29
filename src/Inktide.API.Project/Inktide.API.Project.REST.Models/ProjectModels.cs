using Newtonsoft.Json;

namespace Inktide.API.Project.REST.Models;

public sealed class ProjectSceneResponse
{
    [JsonProperty("id")]           public Guid            Id           { get; set; }
    [JsonProperty("project_id")]   public Guid            ProjectId    { get; set; }
    [JsonProperty("storage_key")]  public string          StorageKey   { get; set; } = string.Empty;
    [JsonProperty("public_url")]   public string?         PublicUrl    { get; set; }
    [JsonProperty("original_name")]public string          OriginalName { get; set; } = string.Empty;
    [JsonProperty("content_type")] public string          ContentType  { get; set; } = string.Empty;
    [JsonProperty("size_bytes")]   public long?           SizeBytes    { get; set; }
    [JsonProperty("display_name")] public string?         DisplayName  { get; set; }
    [JsonProperty("description")]  public string?         Description  { get; set; }
    [JsonProperty("sort_key")]     public string?         SortKey      { get; set; }
    [JsonProperty("created_at")]   public DateTimeOffset  CreatedAt    { get; set; }
    [JsonProperty("is_active")]    public bool            IsActive     { get; set; }
}

public sealed class ProjectToolResponse
{
    [JsonProperty("id")]          public Guid     Id        { get; set; }
    [JsonProperty("project_id")]  public Guid     ProjectId { get; set; }
    [JsonProperty("tool_name")]   public string   ToolName  { get; set; } = string.Empty;
    [JsonProperty("tool_config")] public object?  ToolConfig{ get; set; }
    [JsonProperty("is_enabled")]  public bool     IsEnabled { get; set; }
    [JsonProperty("created_at")]  public DateTimeOffset CreatedAt { get; set; }
}

public sealed class UpsertToolRequest
{
    [JsonProperty("tool_name")]   public string  ToolName  { get; set; } = string.Empty;
    [JsonProperty("tool_config")] public object? ToolConfig{ get; set; }
    [JsonProperty("is_enabled")]  public bool    IsEnabled { get; set; }
}

public sealed class ProjectSkillsResponse
{
    [JsonProperty("system_prompt")]      public string?              SystemPrompt     { get; set; }
    [JsonProperty("behavior_settings")]  public object?              BehaviorSettings { get; set; }
    [JsonProperty("memory_settings")]    public object?              MemorySettings   { get; set; }
    [JsonProperty("auto_pilot")]         public object?              AutoPilot        { get; set; }
    [JsonProperty("tools")]              public List<ProjectToolResponse> Tools        { get; set; } = [];
}

public sealed class UpdateSkillsRequest
{
    [JsonProperty("system_prompt")]      public string?  SystemPrompt     { get; set; }
    [JsonProperty("behavior_settings")]  public object?  BehaviorSettings { get; set; }
    [JsonProperty("memory_settings")]    public object?  MemorySettings   { get; set; }
    [JsonProperty("auto_pilot")]         public object?  AutoPilot        { get; set; }
}

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

    [JsonProperty("personality")]
    public string Personality { get; set; } = string.Empty;

    [JsonProperty("personality_config")]
    public string PersonalityConfig { get; set; } = "{}";

    [JsonProperty("response_behavior")]
    public string ResponseBehavior { get; set; } = "{}";

    [JsonProperty("screen_awareness_settings")]
    public string ScreenAwarenessSettings { get; set; } = "{}";

    [JsonProperty("status")]
    public string Status { get; set; } = "active";

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [JsonProperty("sort_key")]
    public string SortKey { get; set; } = "a0";

    [JsonProperty("preview_url")]
    public string? PreviewUrl { get; set; }
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

    [JsonProperty("personality")]
    public string? Personality { get; set; }

    [JsonProperty("personality_config")]
    public string? PersonalityConfig { get; set; }

    [JsonProperty("response_behavior")]
    public string? ResponseBehavior { get; set; }

    [JsonProperty("screen_awareness_settings")]
    public string? ScreenAwarenessSettings { get; set; }
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

    [JsonProperty("personality")]
    public string? Personality { get; set; }

    [JsonProperty("personality_config")]
    public string? PersonalityConfig { get; set; }

    [JsonProperty("response_behavior")]
    public string? ResponseBehavior { get; set; }

    [JsonProperty("screen_awareness_settings")]
    public string? ScreenAwarenessSettings { get; set; }
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

    /// <summary>Default true - connector stubs require re-authentication.</summary>
    [JsonProperty("import_connectors_disabled")]
    public bool? ImportConnectorsDisabled { get; set; }
}


public sealed class UpdateSceneConfigRequest
{
    [JsonProperty("scene_config")] public object? SceneConfig { get; set; }
}

public sealed class ProjectSceneConfigResponse
{
    [JsonProperty("scene_config")]   public object? SceneConfig   { get; set; }
    [JsonProperty("baseline_mood")]  public string  BaselineMood  { get; set; } = "neutral";
}


public sealed class ProjectPreviewPresignResponse
{
    [JsonProperty("upload_url")] public string UploadUrl  { get; set; } = string.Empty;
    [JsonProperty("public_url")] public string PublicUrl  { get; set; } = string.Empty;
}

public sealed class CompleteProjectPreviewRequest
{
    [JsonProperty("public_url")] public string PublicUrl { get; set; } = string.Empty;
}


public sealed class ProjectChannelResponse
{
    [JsonProperty("id")]          public Guid     Id          { get; set; }
    [JsonProperty("project_id")]  public Guid     ProjectId   { get; set; }
    [JsonProperty("platform")]    public string   Platform    { get; set; } = string.Empty;
    [JsonProperty("channel_name")]public string   ChannelName { get; set; } = string.Empty;
    [JsonProperty("channel_id")]  public string?  ChannelId   { get; set; }
    [JsonProperty("bot_username")]public string   BotUsername { get; set; } = string.Empty;
    [JsonProperty("is_active")]   public bool     IsActive    { get; set; }
    [JsonProperty("connected_at")]public DateTime? ConnectedAt { get; set; }
    [JsonProperty("created_at")]  public DateTime CreatedAt   { get; set; }
}

public sealed class CreateChannelRequest
{
    [JsonProperty("platform")]     public string Platform    { get; set; } = string.Empty;
    [JsonProperty("channel_name")] public string ChannelName { get; set; } = string.Empty;
}

public sealed class PatchChannelRequest
{
    [JsonProperty("is_active")] public bool? IsActive { get; set; }
}


public sealed class ProjectRunPresetResponse
{
    [JsonProperty("id")]                        public Guid    Id                      { get; set; }
    [JsonProperty("project_id")]                public Guid    ProjectId               { get; set; }
    [JsonProperty("name")]                      public string  Name                    { get; set; } = string.Empty;
    [JsonProperty("description")]               public string? Description             { get; set; }
    [JsonProperty("icon")]                      public string? Icon                    { get; set; }
    [JsonProperty("is_active")]                 public bool    IsActive                { get; set; }
    [JsonProperty("override_llm_model_id")]     public string? OverrideLlmModelId      { get; set; }
    [JsonProperty("override_temperature")]      public float?  OverrideTemperature     { get; set; }
    [JsonProperty("override_emotion_preset_id")]public string? OverrideEmotionPresetId { get; set; }
    [JsonProperty("override_voice_profile_id")] public string? OverrideVoiceProfileId  { get; set; }
    [JsonProperty("sort_key")]                  public string  SortKey                 { get; set; } = "a0";
    [JsonProperty("created_at")]                public DateTime CreatedAt              { get; set; }
    [JsonProperty("updated_at")]                public DateTime UpdatedAt              { get; set; }
}

public sealed class UpsertRunPresetRequest
{
    [JsonProperty("name")]                      public string  Name                    { get; set; } = string.Empty;
    [JsonProperty("description")]               public string? Description             { get; set; }
    [JsonProperty("icon")]                      public string? Icon                    { get; set; }
    [JsonProperty("override_llm_model_id")]     public string? OverrideLlmModelId      { get; set; }
    [JsonProperty("override_temperature")]      public float?  OverrideTemperature     { get; set; }
    [JsonProperty("override_emotion_preset_id")]public string? OverrideEmotionPresetId { get; set; }
    [JsonProperty("override_voice_profile_id")] public string? OverrideVoiceProfileId  { get; set; }
}


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
