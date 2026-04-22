using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Grpc.Contracts.AiCards;

namespace Chimera.API.Soul.Grpc.AiCards.Service.Converters;

/// <summary>
/// Maps between <see cref="AiCard"/> domain entities and gRPC contract messages.
/// </summary>
internal static class AiCardGrpcConverter
{

    /// <summary>Maps a domain <see cref="AiCard"/> to a gRPC <see cref="AiCardResponse"/>.</summary>
    public static AiCardResponse ToResponse(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);

        var response = new AiCardResponse
        {
            CardId          = card.Id.ToString(),
            UserId          = card.UserId.ToString(),
            Name            = card.Name,
            Slug            = card.Slug,
            Personality     = card.Personality,
            SystemPrompt    = card.SystemPrompt,
            LlmCatalogId    = card.LlmCatalogId.ToString(),
            LlmConfig       = card.LlmConfig,
            Appearance       = card.Appearance,
            ResponseBehavior = card.ResponseBehavior,
            MemorySettings   = card.MemorySettings,
            AutoPilot        = card.AutoPilot,
            IsActive         = card.IsActive,
            CreatedAt        = card.CreatedAt.ToString("O"),
            UpdatedAt        = card.UpdatedAt.ToString("O"),
        };

        if (card.TtsCatalogId.HasValue)
        {
            response.TtsCatalogId = card.TtsCatalogId.Value.ToString();
        }

        if (card.TtsConfig is not null)
        {
            response.TtsConfig = card.TtsConfig;
        }

        if (card.AvatarUrl is not null)
        {
            response.AvatarUrl = card.AvatarUrl;
        }

        return response;
    }

    /// <summary>Maps a <see cref="CreateCardRequest"/> to a new <see cref="AiCard"/> domain entity.</summary>
    public static AiCard ToDomain(CreateCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new AiCard
        {
            UserId          = Guid.Parse(request.UserId),
            Name            = request.Name,
            Slug            = request.Slug,
            Personality     = request.Personality,
            SystemPrompt    = request.SystemPrompt,
            LlmCatalogId    = Guid.Parse(request.LlmCatalogId),
            LlmConfig       = request.LlmConfig,
            TtsCatalogId    = request.HasTtsCatalogId ? Guid.Parse(request.TtsCatalogId) : null,
            TtsConfig       = request.HasTtsConfig ? request.TtsConfig : null,
            Appearance       = request.Appearance,
            ResponseBehavior = request.ResponseBehavior,
            MemorySettings   = request.MemorySettings,
            AutoPilot        = request.AutoPilot,
            AvatarUrl        = request.HasAvatarUrl ? request.AvatarUrl : null,
        };
    }

    /// <summary>Applies fields from an <see cref="UpdateCardRequest"/> onto an existing <see cref="AiCard"/>.</summary>
    public static void ApplyUpdate(UpdateCardRequest request, AiCard card)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(card);

        card.Name            = request.Name;
        card.Slug            = request.Slug;
        card.Personality     = request.Personality;
        card.SystemPrompt    = request.SystemPrompt;
        card.LlmCatalogId    = Guid.Parse(request.LlmCatalogId);
        card.LlmConfig       = request.LlmConfig;
        card.TtsCatalogId    = request.HasTtsCatalogId ? Guid.Parse(request.TtsCatalogId) : null;
        card.TtsConfig       = request.HasTtsConfig ? request.TtsConfig : null;
        card.Appearance       = request.Appearance;
        card.ResponseBehavior = request.ResponseBehavior;
        card.MemorySettings   = request.MemorySettings;
        card.AutoPilot        = request.AutoPilot;
        card.IsActive         = request.IsActive;
        card.AvatarUrl        = request.HasAvatarUrl ? request.AvatarUrl : null;
    }

}
