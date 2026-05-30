using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Domain.ValueObjects;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Constructs and patches AiCard domain entities from REST request models.
/// SRP: one reason to change — write/mutate representation of an AiCard.
/// </summary>
public static class AiCardEntityFactory
{
    public static AiCard ToEntity(CreateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        return new AiCard
        {
            Name             = request.Name,
            Personality      = request.Personality ?? string.Empty,
            SystemPrompt     = request.SystemPrompt,
            AvatarUrl        = request.AvatarUrl,
            LlmCatalogId     = request.LlmCatalogId,
            LlmConfig        = Serialize(request.LlmConfig) ?? "{}",
            TtsCatalogId     = request.TtsCatalogId,
            TtsConfig        = Serialize(request.TtsConfig),
            Appearance         = Serialize(request.Appearance) ?? "{}",
            ResponseBehavior   = Serialize(request.ResponseBehavior) ?? "{}",
            MemorySettings          = Serialize(request.MemorySettings) ?? "{}",
            AutoPilot               = Serialize(request.AutoPilot) ?? "{}",
            ScreenAwarenessSettings = Serialize(request.ScreenAwareness) ?? "{}",
            PersonalityConfig       = MapPersonality(request.PersonalityConfig),
        };
    }

    public static void ApplyUpdate(AiCard existing, UpdateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(request);

        if (request.Name             is not null) existing.Name             = request.Name;
        if (request.Slug             is not null) existing.Slug             = request.Slug;
        if (request.Personality      is not null) existing.Personality      = request.Personality;
        if (request.SystemPrompt     is not null) existing.SystemPrompt     = request.SystemPrompt;
        // AvatarUrl is intentionally not handled here — use POST /avatar to change it.
        if (request.LlmCatalogId.HasValue)        existing.LlmCatalogId     = request.LlmCatalogId.Value;
        if (request.LlmConfig        is not null) existing.LlmConfig        = Serialize(request.LlmConfig) ?? "{}";
        if (request.TtsCatalogId.HasValue)        existing.TtsCatalogId     = request.TtsCatalogId.Value;
        if (request.TtsConfig        is not null) existing.TtsConfig        = Serialize(request.TtsConfig);
        if (request.Appearance       is not null) existing.Appearance       = Serialize(request.Appearance) ?? "{}";
        if (request.ResponseBehavior is not null) existing.ResponseBehavior = Serialize(request.ResponseBehavior) ?? "{}";
        if (request.MemorySettings   is not null) existing.MemorySettings          = Serialize(request.MemorySettings) ?? "{}";
        if (request.AutoPilot        is not null) existing.AutoPilot               = Serialize(request.AutoPilot) ?? "{}";
        if (request.ScreenAwareness  is not null) existing.ScreenAwarenessSettings = Serialize(request.ScreenAwareness) ?? "{}";
        if (request.PersonalityConfig  is not null) existing.PersonalityConfig  = MapPersonality(request.PersonalityConfig);
        if (request.Description        is not null) existing.Description        = request.Description;
        if (request.CoverUrl         is not null) existing.CoverUrl         = request.CoverUrl;
        if (request.IsActive.HasValue)            existing.IsActive         = request.IsActive.Value;

        if (request.Status is not null && Enum.TryParse<AiCardStatus>(request.Status, ignoreCase: true, out var status))
            existing.Status = status;

        if (request.Visibility is not null && Enum.TryParse<AiCardVisibility>(request.Visibility, ignoreCase: true, out var vis))
            existing.Visibility = vis;
    }

    private static PersonalitySettings MapPersonality(AiCardPersonalityDto? dto) =>
        dto is null ? new PersonalitySettings() : new PersonalitySettings
        {
            Warmth                = (float)dto.Warmth,
            Playfulness           = (float)dto.Playfulness,
            Assertiveness         = (float)dto.Assertiveness,
            Empathy               = (float)dto.Empathy,
            Formality             = (float)dto.Formality,
            Sarcasm               = (float)dto.Sarcasm,
            EmotionVolatility     = (float)dto.EmotionVolatility,
            EmotionResponsiveness = (float)dto.EmotionResponsiveness,
            EmotionMemory         = (float)dto.EmotionMemory,
            StressBehavior        = dto.StressBehavior,
            BaselineMood          = dto.BaselineMood,
            PresetId              = dto.PresetId,
        };

    private static string? Serialize<T>(T? obj) where T : class =>
        obj is null ? null : JsonConvert.SerializeObject(obj);
}
