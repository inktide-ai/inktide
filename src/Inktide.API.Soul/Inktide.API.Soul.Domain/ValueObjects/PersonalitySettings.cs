using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class PersonalitySettings
{


    [JsonPropertyName("warmth")]
    public float Warmth { get; set; } = 0.7f;

    [JsonPropertyName("playfulness")]
    public float Playfulness { get; set; } = 0.5f;

    [JsonPropertyName("assertiveness")]
    public float Assertiveness { get; set; } = 0.5f;

    [JsonPropertyName("empathy")]
    public float Empathy { get; set; } = 0.7f;

    [JsonPropertyName("formality")]
    public float Formality { get; set; } = 0.3f;

    [JsonPropertyName("sarcasm")]
    public float Sarcasm { get; set; } = 0.2f;


    /// <summary>How widely mood swings per message (0 = flat, 1 = very volatile).</summary>
    [JsonPropertyName("emotion_volatility")]
    public float EmotionVolatility { get; set; } = 0.5f;

    /// <summary>How quickly emotions adapt to incoming messages. Also scales TTS speed modulation.</summary>
    [JsonPropertyName("emotion_responsiveness")]
    public float EmotionResponsiveness { get; set; } = 0.7f;

    /// <summary>How much prior emotional state persists across turns (0 = forgetful, 1 = very persistent).</summary>
    [JsonPropertyName("emotion_memory")]
    public float EmotionMemory { get; set; } = 0.5f;


    /// <summary>deflect | humor | withdraw | confront</summary>
    [JsonPropertyName("stress_behavior")]
    public string StressBehavior { get; set; } = "deflect";

    /// <summary>neutral | happy | chill | melancholic | hyped</summary>
    [JsonPropertyName("baseline_mood")]
    public string BaselineMood { get; set; } = "neutral";

    /// <summary>Named preset this config was derived from. Null means fully custom.</summary>
    [JsonPropertyName("preset_id")]
    public string? PresetId { get; set; }


    public static PersonalitySettings Parse(string? json)
    {
        var s = ValueObjectJson.ParseOrDefault<PersonalitySettings>(json);
        s.Clamp();
        return s;
    }

    public string ToJson() => JsonSerializer.Serialize(this, ValueObjectJson.Opts);

    private void Clamp()
    {
        Warmth                = Math.Clamp(Warmth,                0f, 1f);
        Playfulness           = Math.Clamp(Playfulness,           0f, 1f);
        Assertiveness         = Math.Clamp(Assertiveness,         0f, 1f);
        Empathy               = Math.Clamp(Empathy,               0f, 1f);
        Formality             = Math.Clamp(Formality,             0f, 1f);
        Sarcasm               = Math.Clamp(Sarcasm,               0f, 1f);
        EmotionVolatility     = Math.Clamp(EmotionVolatility,     0f, 1f);
        EmotionResponsiveness = Math.Clamp(EmotionResponsiveness, 0f, 1f);
        EmotionMemory         = Math.Clamp(EmotionMemory,         0f, 1f);
    }

}
