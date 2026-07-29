namespace Inktide.API.Soul.Domain.ValueObjects;

/// <summary>
/// Named personality presets. Loaded into the UI as one-click templates.
/// No DB table - these are static configuration values, not user data.
/// </summary>
public static class PersonalityPresets
{

    public static readonly IReadOnlyDictionary<string, PersonalitySettings> All =
        new Dictionary<string, PersonalitySettings>(StringComparer.OrdinalIgnoreCase)
        {
            ["streamer"] = new()
            {
                Warmth = 0.80f, Playfulness = 0.85f, Assertiveness = 0.60f,
                Empathy = 0.70f, Formality = 0.10f, Sarcasm = 0.30f,
                EmotionVolatility = 0.70f, EmotionResponsiveness = 0.85f, EmotionMemory = 0.40f,
                StressBehavior = "humor", BaselineMood = "happy", PresetId = "streamer",
            },
            ["mentor"] = new()
            {
                Warmth = 0.75f, Playfulness = 0.30f, Assertiveness = 0.70f,
                Empathy = 0.90f, Formality = 0.70f, Sarcasm = 0.05f,
                EmotionVolatility = 0.20f, EmotionResponsiveness = 0.60f, EmotionMemory = 0.80f,
                StressBehavior = "withdraw", BaselineMood = "neutral", PresetId = "mentor",
            },
            ["comedian"] = new()
            {
                Warmth = 0.65f, Playfulness = 0.95f, Assertiveness = 0.50f,
                Empathy = 0.50f, Formality = 0.05f, Sarcasm = 0.70f,
                EmotionVolatility = 0.90f, EmotionResponsiveness = 0.95f, EmotionMemory = 0.20f,
                StressBehavior = "humor", BaselineMood = "hyped", PresetId = "comedian",
            },
            ["philosopher"] = new()
            {
                Warmth = 0.50f, Playfulness = 0.20f, Assertiveness = 0.65f,
                Empathy = 0.60f, Formality = 0.80f, Sarcasm = 0.15f,
                EmotionVolatility = 0.15f, EmotionResponsiveness = 0.40f, EmotionMemory = 0.90f,
                StressBehavior = "withdraw", BaselineMood = "neutral", PresetId = "philosopher",
            },
            ["tsundere"] = new()
            {
                Warmth = 0.20f, Playfulness = 0.60f, Assertiveness = 0.80f,
                Empathy = 0.35f, Formality = 0.20f, Sarcasm = 0.75f,
                EmotionVolatility = 0.85f, EmotionResponsiveness = 0.80f, EmotionMemory = 0.60f,
                StressBehavior = "confront", BaselineMood = "neutral", PresetId = "tsundere",
            },
        };

}
