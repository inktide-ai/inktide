using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

/// <summary>LLM provider parameters stored in ai_card.llm_config (JSONB).</summary>
public sealed class AiCardLlmConfigDto
{
    [JsonProperty("provider_id")]
    public string? ProviderId { get; set; }

    [JsonProperty("model_id")]
    public string? ModelId { get; set; }

    [JsonProperty("base_url")]
    public string? BaseUrl { get; set; }

    [JsonProperty("temperature")]
    public double Temperature { get; set; } = 0.7;

    [JsonProperty("max_tokens")]
    public int MaxTokens { get; set; } = 512;

    [JsonProperty("top_p")]
    public double TopP { get; set; } = 1.0;

    [JsonProperty("frequency_penalty")]
    public double FrequencyPenalty { get; set; } = 0.0;

    [JsonProperty("presence_penalty")]
    public double PresencePenalty { get; set; } = 0.0;
}

/// <summary>TTS provider parameters stored in ai_card.tts_config (JSONB).</summary>
public sealed class AiCardTtsConfigDto
{
    [JsonProperty("provider_id")]
    public string? ProviderId { get; set; }

    [JsonProperty("voice_id")]
    public string? VoiceId { get; set; }

    [JsonProperty("model_id")]
    public string? ModelId { get; set; }

    [JsonProperty("base_url")]
    public string? BaseUrl { get; set; }

    [JsonProperty("speed")]
    public double Speed { get; set; } = 1.0;

    [JsonProperty("stability")]
    public double Stability { get; set; } = 0.5;

    [JsonProperty("similarity_boost")]
    public double SimilarityBoost { get; set; } = 0.75;

    [JsonProperty("style")]
    public double Style { get; set; } = 0.0;

    [JsonProperty("use_speaker_boost")]
    public bool UseSpeakerBoost { get; set; } = true;

    [JsonProperty("pitch")]
    public double Pitch { get; set; } = 1.0;

    [JsonProperty("volume")]
    public double Volume { get; set; } = 1.0;
}

/// <summary>Visual settings stored in ai_card.appearance (JSONB).</summary>
public sealed class AiCardAppearanceDto
{
    [JsonProperty("banner_color_index")]
    public int BannerColorIndex { get; set; } = 0;

    [JsonProperty("banner_custom_color")]
    public string? BannerCustomColor { get; set; }

    [JsonProperty("banner_image_url")]
    public string? BannerImageUrl { get; set; }

    [JsonProperty("model_type")]
    public string ModelType { get; set; } = "none";

    [JsonProperty("model_file_name")]
    public string? ModelFileName { get; set; }

    [JsonProperty("key_phrases")]
    public string[] KeyPhrases { get; set; } = [];

    [JsonProperty("active_scene_id")]
    public string? ActiveSceneId { get; set; }
}

/// <summary>Runtime response knobs stored in ai_card.response_behavior (JSONB).</summary>
public sealed class AiCardBehaviorDto
{
    [JsonProperty("response_delay_ms")]
    public int ResponseDelayMs { get; set; } = 0;

    [JsonProperty("max_response_length")]
    public int MaxResponseLength { get; set; } = 500;

    [JsonProperty("auto_moderate")]
    public bool AutoModerate { get; set; } = false;

    [JsonProperty("language")]
    public string Language { get; set; } = "en";

    [JsonProperty("typing_simulation")]
    public bool TypingSimulation { get; set; } = false;

    [JsonProperty("emotion_intensity_scale")]
    public double EmotionIntensityScale { get; set; } = 1.0;
}

/// <summary>Memory settings stored in ai_card.memory_settings (JSONB).</summary>
public sealed class AiCardMemoryDto
{
    [JsonProperty("enabled")]
    public bool Enabled { get; set; } = false;

    [JsonProperty("max_memories")]
    public int MaxMemories { get; set; } = 100;

    [JsonProperty("retention_days")]
    public int RetentionDays { get; set; } = 90;

    [JsonProperty("importance_threshold")]
    public double ImportanceThreshold { get; set; } = 0.5;
}

/// <summary>Structured personality traits and emotional dynamics stored in ai_card.personality_config (JSONB).</summary>
public sealed class AiCardPersonalityDto
{
    [JsonProperty("warmth")]
    public double Warmth { get; set; } = 0.7;

    [JsonProperty("playfulness")]
    public double Playfulness { get; set; } = 0.5;

    [JsonProperty("assertiveness")]
    public double Assertiveness { get; set; } = 0.5;

    [JsonProperty("empathy")]
    public double Empathy { get; set; } = 0.7;

    [JsonProperty("formality")]
    public double Formality { get; set; } = 0.3;

    [JsonProperty("sarcasm")]
    public double Sarcasm { get; set; } = 0.2;

    [JsonProperty("emotion_volatility")]
    public double EmotionVolatility { get; set; } = 0.5;

    [JsonProperty("emotion_responsiveness")]
    public double EmotionResponsiveness { get; set; } = 0.7;

    [JsonProperty("emotion_memory")]
    public double EmotionMemory { get; set; } = 0.5;

    [JsonProperty("stress_behavior")]
    public string StressBehavior { get; set; } = "deflect";

    [JsonProperty("baseline_mood")]
    public string BaselineMood { get; set; } = "neutral";

    [JsonProperty("preset_id")]
    public string? PresetId { get; set; }
}

/// <summary>Autonomy / idle behaviour stored in ai_card.auto_pilot (JSONB).</summary>
public sealed class AiCardAutoPilotDto
{
    [JsonProperty("enabled")]
    public bool Enabled { get; set; } = false;

    [JsonProperty("idle_timeout_seconds")]
    public int IdleTimeoutSeconds { get; set; } = 300;

    [JsonProperty("min_interval_seconds")]
    public int MinIntervalSeconds { get; set; } = 60;

    [JsonProperty("mood")]
    public string Mood { get; set; } = "neutral";
}

/// <summary>Screen awareness config stored in ai_card.screen_awareness_settings (JSONB).</summary>
public sealed class AiCardScreenAwarenessDto
{
    [JsonProperty("enabled")]
    public bool Enabled { get; set; } = false;

    /// <summary>Per-card hourly frame budget override. 0 = use plan default.</summary>
    [JsonProperty("hourly_budget_override")]
    public int HourlyBudgetOverride { get; set; } = 0;

    /// <summary>pHash Hamming distance threshold for scene deduplication (0-64).</summary>
    [JsonProperty("phash_threshold")]
    public int PHashThreshold { get; set; } = 10;
}
