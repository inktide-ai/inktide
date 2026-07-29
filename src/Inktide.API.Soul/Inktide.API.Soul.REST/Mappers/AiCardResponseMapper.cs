using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Maps AiCard domain entities to REST response models.
/// SRP: one reason to change - AiCard read representation.
/// </summary>
public static class AiCardResponseMapper
{
    public static AiCardResponse ToResponse(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);
        return new AiCardResponse
        {
            Id           = card.Id,
            Name         = card.Name,
            Slug         = card.Slug,
            AvatarUrl    = card.AvatarUrl,
            Description  = card.Description,
            Status       = EnumToString(card.Status),
            CoverUrl     = card.CoverUrl,
            LlmCatalogId = card.LlmCatalogId,
            LlmConfig    = Deserialize<AiCardLlmConfigDto>(card.LlmConfig),
            LlmModel     = card.LlmCatalog is not null ? CatalogResponseMapper.ToLlmResponse(card.LlmCatalog) : null,
            TtsCatalogId = card.TtsCatalogId,
            TtsConfig    = Deserialize<AiCardTtsConfigDto>(card.TtsConfig),
            TtsVoice     = card.TtsCatalog is not null ? CatalogResponseMapper.ToTtsResponse(card.TtsCatalog) : null,
            Appearance   = Deserialize<AiCardAppearanceDto>(card.Appearance),
            Visibility   = EnumToString(card.Visibility),
            Category     = card.Category,
            Tags         = DeserializeOrEmpty(card.Tags),
            IsActive     = card.IsActive,
            CreatedAt    = card.CreatedAt,
            UpdatedAt    = card.UpdatedAt,
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
            LlmModelName = card.LlmCatalog?.DisplayName,
            Description  = card.Description,
            Status       = EnumToString(card.Status),
            CoverUrl     = card.CoverUrl,
            IsActive     = card.IsActive,
            UpdatedAt    = card.UpdatedAt,
            SortKey      = card.SortKey,
        };
    }

    private static IReadOnlyList<string> DeserializeOrEmpty(string? json) =>
        string.IsNullOrEmpty(json) ? [] : JsonConvert.DeserializeObject<List<string>>(json) ?? [];

    private static T? Deserialize<T>(string? json) where T : class =>
        string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject<T>(json);

    private static string EnumToString<TEnum>(TEnum value) where TEnum : struct, Enum =>
        value.ToString().ToLowerInvariant();
}
