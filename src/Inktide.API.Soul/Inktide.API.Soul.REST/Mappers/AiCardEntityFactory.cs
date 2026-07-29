using System.Text.Json;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Constructs and patches AiCard domain entities from REST request models.
/// SRP: one reason to change - write/mutate representation of an AiCard.
/// </summary>
public static class AiCardEntityFactory
{
    private static readonly JsonSerializerOptions SerializerOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public static AiCard ToEntity(CreateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        return new AiCard
        {
            Name         = request.Name,
            AvatarUrl    = request.AvatarUrl,
            LlmCatalogId = request.LlmCatalogId,
            LlmConfig    = Serialize(request.LlmConfig) ?? "{}",
            TtsCatalogId = request.TtsCatalogId,
            TtsConfig    = Serialize(request.TtsConfig),
            Appearance   = Serialize(request.Appearance) ?? "{}",
        };
    }

    public static void ApplyUpdate(AiCard existing, UpdateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(request);

        if (request.Name        is not null) existing.Name        = request.Name;
        if (request.Slug        is not null) existing.Slug        = request.Slug;
        // AvatarUrl is intentionally not handled here - use POST /avatar to change it.
        if (request.LlmCatalogId.HasValue)   existing.LlmCatalogId = request.LlmCatalogId.Value;
        if (request.LlmConfig   is not null) existing.LlmConfig   = Serialize(request.LlmConfig) ?? "{}";
        if (request.TtsCatalogId.HasValue)   existing.TtsCatalogId = request.TtsCatalogId.Value;
        if (request.TtsConfig   is not null) existing.TtsConfig   = Serialize(request.TtsConfig);
        if (request.Appearance  is not null) existing.Appearance  = Serialize(request.Appearance) ?? "{}";
        if (request.Description is not null) existing.Description = request.Description;
        if (request.CoverUrl    is not null) existing.CoverUrl    = request.CoverUrl;
        if (request.IsActive.HasValue)       existing.IsActive    = request.IsActive.Value;

        if (request.Status is not null && Enum.TryParse<AiCardStatus>(request.Status, ignoreCase: true, out var status))
            existing.Status = status;

        if (request.Visibility is not null && Enum.TryParse<AiCardVisibility>(request.Visibility, ignoreCase: true, out var vis))
            existing.Visibility = vis;
    }

    private static string? Serialize<T>(T? obj) where T : class =>
        obj is null ? null : JsonSerializer.Serialize(obj, SerializerOpts);
}
