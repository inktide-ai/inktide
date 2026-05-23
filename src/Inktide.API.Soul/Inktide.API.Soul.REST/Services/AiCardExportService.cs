using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Services;

/// <summary>
/// Builds a portable .inkt project archive (JSON download) from an AI card + its graph.
/// Lives in the REST layer because it composes REST-layer DTOs for the download payload.
/// </summary>
public sealed class AiCardExportService : IAiCardExportService
{

    private readonly IAiCardService _cardService;
    private readonly IGraphRepository _graphRepository;
    private readonly IProjectBySoulQuery? _projectQuery;

    public AiCardExportService(
        IAiCardService cardService,
        IGraphRepository graphRepository,
        IProjectBySoulQuery? projectQuery = null)
    {
        _cardService     = cardService     ?? throw new ArgumentNullException(nameof(cardService));
        _graphRepository = graphRepository ?? throw new ArgumentNullException(nameof(graphRepository));
        _projectQuery    = projectQuery;
    }


    public async Task<AiCardExportResult?> ExportAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default)
    {
        var card = await _cardService.GetByIdAsync(userId, cardId, ct);
        if (card is null) return null;

        // Resolve the project linked to this soul, then fetch its graph.
        Inktide.API.Graph.Domain.Entities.GraphDefinition? graph = null;
        if (_projectQuery is not null)
        {
            var projectLink = await _projectQuery.FindProjectIdBySoulIdAsync(cardId, ct);
            if (projectLink is not null)
                graph = await _graphRepository.FindByProjectIdAsync(projectLink.Id, ct);
        }

        var dto = new InktProjectDto
        {
            Version    = "1",
            ExportedAt = DateTimeOffset.UtcNow,
            Name       = card.Name,
            Soul = new InktSoulDto
            {
                Name             = card.Name,
                Slug             = card.Slug,
                Description      = card.Description,
                Status           = card.Status.ToString().ToLower(),
                CoverUrl         = card.CoverUrl,
                AvatarUrl        = card.AvatarUrl,
                Personality      = card.Personality,
                SystemPrompt     = card.SystemPrompt,
                LlmCatalogId     = card.LlmCatalogId,
                LlmConfig        = Deserialize<AiCardLlmConfigDto>(card.LlmConfig),
                TtsCatalogId     = card.TtsCatalogId,
                TtsConfig        = Deserialize<AiCardTtsConfigDto>(card.TtsConfig),
                Appearance       = Deserialize<AiCardAppearanceDto>(card.Appearance),
                ResponseBehavior = Deserialize<AiCardBehaviorDto>(card.ResponseBehavior),
                MemorySettings   = Deserialize<AiCardMemoryDto>(card.MemorySettings),
                AutoPilot        = Deserialize<AiCardAutoPilotDto>(card.AutoPilot),
            },
            Graph = graph is null ? null : new InktGraphDto
            {
                Nodes = graph.Nodes.Cast<object>().ToList(),
                Edges = graph.Edges.Cast<object>().ToList(),
            },
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
