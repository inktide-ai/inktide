using System.Text.Json.Serialization;

namespace Inktide.API.Soul.REST.Models;

public sealed class CreateRunPresetRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("icon")]
    public string? Icon { get; set; }

    [JsonPropertyName("override_llm_model_id")]
    public string? OverrideLlmModelId { get; set; }

    [JsonPropertyName("override_temperature")]
    public float? OverrideTemperature { get; set; }

    [JsonPropertyName("override_emotion_preset_id")]
    public string? OverrideEmotionPresetId { get; set; }

    [JsonPropertyName("override_voice_profile_id")]
    public string? OverrideVoiceProfileId { get; set; }
}

public sealed class UpdateRunPresetRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("icon")]
    public string? Icon { get; set; }

    [JsonPropertyName("override_llm_model_id")]
    public string? OverrideLlmModelId { get; set; }

    [JsonPropertyName("override_temperature")]
    public float? OverrideTemperature { get; set; }

    [JsonPropertyName("override_emotion_preset_id")]
    public string? OverrideEmotionPresetId { get; set; }

    [JsonPropertyName("override_voice_profile_id")]
    public string? OverrideVoiceProfileId { get; set; }
}

public sealed class ReorderPresetRequest
{
    [JsonPropertyName("previous_id")] public Guid? PreviousId { get; set; }
    [JsonPropertyName("next_id")]     public Guid? NextId     { get; set; }
}

public sealed class RunPresetResponse
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("ai_card_id")]
    public Guid AiCardId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("icon")]
    public string? Icon { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; }

    [JsonPropertyName("sort_key")]
    public string SortKey { get; set; } = string.Empty;

    [JsonPropertyName("override_llm_model_id")]
    public string? OverrideLlmModelId { get; set; }

    [JsonPropertyName("override_temperature")]
    public float? OverrideTemperature { get; set; }

    [JsonPropertyName("override_emotion_preset_id")]
    public string? OverrideEmotionPresetId { get; set; }

    [JsonPropertyName("override_voice_profile_id")]
    public string? OverrideVoiceProfileId { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
