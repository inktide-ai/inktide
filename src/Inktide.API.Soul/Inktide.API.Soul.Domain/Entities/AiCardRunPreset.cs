using Inktide.API.Core.Generators;
namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// A named runtime configuration preset for an AI card.
/// Overrides LLM model, temperature, emotion profile, or voice without mutating the base card config.
/// At most one preset per card is active at a time.
/// </summary>
public sealed class AiCardRunPreset
{

    private AiCardRunPreset() { }


    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid AiCardId { get; private set; }

    /// <summary>Human-readable name (e.g. "Streaming Mode").</summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>Optional tagline displayed below the name.</summary>
    public string? Description { get; private set; }

    /// <summary>Emoji or icon slug shown on the card (e.g. "🎮").</summary>
    public string? Icon { get; private set; }

    /// <summary>True when this preset is currently applied at runtime. Only one per card may be active.</summary>
    public bool IsActive { get; private set; }

    /// <summary>Overrides <c>AiCard.LlmConfig.ModelId</c> at runtime. Null = use soul default.</summary>
    public string? OverrideLlmModelId { get; private set; }

    /// <summary>Overrides LLM sampling temperature. Null = use soul default.</summary>
    public float? OverrideTemperature { get; private set; }

    /// <summary>Overrides the personality preset slug (emotion profile). Null = use soul default.</summary>
    public string? OverrideEmotionPresetId { get; private set; }

    /// <summary>Overrides TTS voice id. Null = use soul default.</summary>
    public string? OverrideVoiceProfileId { get; private set; }

    /// <summary>Fractional index key for drag-and-drop ordering. Sorts lexicographically ASC.</summary>
    public string SortKey { get; private set; } = "a0";

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // EF Core navigation
    public AiCard? AiCard { get; private set; }


    public static AiCardRunPreset Create(
        Guid userId,
        Guid aiCardId,
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId,
        string sortKey)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId must not be empty.", nameof(userId));
        if (aiCardId == Guid.Empty) throw new ArgumentException("aiCardId must not be empty.", nameof(aiCardId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name is required.", nameof(name));
        if (string.IsNullOrEmpty(sortKey)) throw new ArgumentException("sortKey is required.", nameof(sortKey));

        var now = DateTime.UtcNow;
        return new AiCardRunPreset
        {
            Id                    = IdGenerator.New(),
            UserId                = userId,
            AiCardId              = aiCardId,
            Name                  = name.Trim(),
            Description           = Trim(description),
            Icon                  = Trim(icon),
            IsActive              = false,
            SortKey               = sortKey,
            OverrideLlmModelId    = Trim(overrideLlmModelId),
            OverrideTemperature   = overrideTemperature,
            OverrideEmotionPresetId = Trim(overrideEmotionPresetId),
            OverrideVoiceProfileId  = Trim(overrideVoiceProfileId),
            CreatedAt             = now,
            UpdatedAt             = now,
        };
    }

    public void SetSortKey(string key)
    {
        if (string.IsNullOrEmpty(key)) throw new ArgumentException("sort key required", nameof(key));
        SortKey   = key;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name is required.", nameof(name));

        Name                    = name.Trim();
        Description             = Trim(description);
        Icon                    = Trim(icon);
        OverrideLlmModelId      = Trim(overrideLlmModelId);
        OverrideTemperature     = overrideTemperature;
        OverrideEmotionPresetId = Trim(overrideEmotionPresetId);
        OverrideVoiceProfileId  = Trim(overrideVoiceProfileId);
        UpdatedAt               = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive  = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive  = false;
        UpdatedAt = DateTime.UtcNow;
    }


    private static string? Trim(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

}
