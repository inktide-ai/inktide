using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Services;

/// <summary>
/// Builds a portable .inkt project archive (JSON download) from an AI card.
/// Lives in the REST layer because it composes REST-layer DTOs for the download payload.
/// </summary>
public sealed class AiCardExportService : IAiCardExportService
{

    private readonly IAiCardService _cardService;

    public AiCardExportService(IAiCardService cardService)
    {
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
    }


    public async Task<AiCardExportResult?> ExportAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default)
    {
        var card = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null) return null;

        var dto = new InktProjectDto
        {
            Version    = "1",
            ExportedAt = DateTimeOffset.UtcNow,
            Name       = card.Name,
            Soul = new InktSoulDto
            {
                Name         = card.Name,
                Slug         = card.Slug,
                Description  = card.Description,
                Status       = card.Status.ToString().ToLower(),
                CoverUrl     = card.CoverUrl,
                AvatarUrl    = card.AvatarUrl,
                LlmCatalogId = card.LlmCatalogId,
                LlmConfig    = Deserialize<AiCardLlmConfigDto>(card.LlmConfig),
                TtsCatalogId = card.TtsCatalogId,
                TtsConfig    = Deserialize<AiCardTtsConfigDto>(card.TtsConfig),
                Appearance   = Deserialize<AiCardAppearanceDto>(card.Appearance),
            },
            Graph = null,
        };

        var json  = JsonConvert.SerializeObject(dto, Formatting.Indented);
        var bytes = System.Text.Encoding.UTF8.GetBytes(json);

        return new AiCardExportResult(
            FileName:    $"{card.Slug}.inkt",
            Content:     bytes,
            ContentType: "application/json");
    }


    private static T? Deserialize<T>(string? json) where T : class =>
        string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject<T>(json);

}
