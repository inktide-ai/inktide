using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Constructs and patches AiCard domain entities from REST request models.
/// SRP: one reason to change — write/mutate representation of an AiCard.
/// OCP: adding a new request field only requires editing this file, not AiCardResponseMapper.
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
            LlmConfig        = SerializeJson(request.LlmConfig) ?? "{}",
            TtsCatalogId     = request.TtsCatalogId,
            TtsConfig        = SerializeJson(request.TtsConfig),
            Appearance       = SerializeJson(request.Appearance) ?? "{}",
            ResponseBehavior = SerializeJson(request.ResponseBehavior) ?? "{}",
            MemorySettings   = SerializeJson(request.MemorySettings) ?? "{}",
            AutoPilot        = SerializeJson(request.AutoPilot) ?? "{}",
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
        if (request.AvatarUrl        is not null) existing.AvatarUrl        = request.AvatarUrl;
        if (request.LlmCatalogId.HasValue)        existing.LlmCatalogId     = request.LlmCatalogId.Value;
        if (request.LlmConfig        is not null) existing.LlmConfig        = SerializeJson(request.LlmConfig) ?? "{}";
        if (request.TtsCatalogId.HasValue)        existing.TtsCatalogId     = request.TtsCatalogId.Value;
        if (request.TtsConfig        is not null) existing.TtsConfig        = SerializeJson(request.TtsConfig);
        if (request.Appearance       is not null) existing.Appearance       = SerializeJson(request.Appearance) ?? "{}";
        if (request.ResponseBehavior is not null) existing.ResponseBehavior = SerializeJson(request.ResponseBehavior) ?? "{}";
        if (request.MemorySettings   is not null) existing.MemorySettings   = SerializeJson(request.MemorySettings) ?? "{}";
        if (request.AutoPilot        is not null) existing.AutoPilot        = SerializeJson(request.AutoPilot) ?? "{}";
        if (request.IsActive.HasValue)            existing.IsActive         = request.IsActive.Value;
        if (request.Visibility       is not null) existing.Visibility       = request.Visibility;
    }

    private static string? SerializeJson(object? obj) =>
        obj is null ? null : JsonConvert.SerializeObject(obj);
}
