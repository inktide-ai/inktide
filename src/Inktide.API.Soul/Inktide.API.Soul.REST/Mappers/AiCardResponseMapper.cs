using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Maps AiCard domain entities to REST response models.
/// SRP: one reason to change — AiCard read representation.
/// OCP: adding LlmModel/TtsVoice fields only requires editing this file, not AiCardEntityFactory.
/// </summary>
public static class AiCardResponseMapper
{
    public static AiCardResponse ToResponse(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);
        return new AiCardResponse
        {
            Id               = card.Id,
            Name             = card.Name,
            Slug             = card.Slug,
            AvatarUrl        = card.AvatarUrl,
            Personality      = card.Personality,
            SystemPrompt     = card.SystemPrompt,
            LlmCatalogId     = card.LlmCatalogId,
            LlmConfig        = DeserializeJson(card.LlmConfig),
            LlmModel         = card.LlmCatalog is not null ? CatalogResponseMapper.ToLlmResponse(card.LlmCatalog) : null,
            TtsCatalogId     = card.TtsCatalogId,
            TtsConfig        = DeserializeJson(card.TtsConfig),
            TtsVoice         = card.TtsCatalog is not null ? CatalogResponseMapper.ToTtsResponse(card.TtsCatalog) : null,
            Appearance       = DeserializeJson(card.Appearance),
            ResponseBehavior = DeserializeJson(card.ResponseBehavior),
            MemorySettings   = DeserializeJson(card.MemorySettings),
            AutoPilot        = DeserializeJson(card.AutoPilot),
            Visibility       = card.Visibility,
            Channels         = card.Channels?.Select(ChannelResponseMapper.ToChannelResponse).ToList(),
            Tools            = card.Tools?.Select(ToolResponseMapper.ToToolResponse).ToList(),
            IsActive         = card.IsActive,
            CreatedAt        = card.CreatedAt,
            UpdatedAt        = card.UpdatedAt,
        };
    }

    public static AiCardListItem ToListItem(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);
        return new AiCardListItem
        {
            Id           = card.Id,
            Name         = card.Name,
            Slug         = card.Slug,
            AvatarUrl    = card.AvatarUrl,
            Personality  = card.Personality,
            LlmModelName = card.LlmCatalog?.DisplayName,
            IsActive     = card.IsActive,
            UpdatedAt    = card.UpdatedAt,
        };
    }

    private static object? DeserializeJson(string? json) =>
        string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject(json);
}
