using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.ValueObjects;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Infrastructure.Queries;

public sealed class AiCardChannelQueryService : IAiCardChannelQueryService
{

    private readonly SoulDbContext _db;
    private readonly ILogger<AiCardChannelQueryService> _logger;

    public AiCardChannelQueryService(SoulDbContext db, ILogger<AiCardChannelQueryService> logger)
    {
        _db     = db     ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<AiCardChannelContext?> ResolveByChannelIdAsync(
        string channelId,
        CancellationToken ct = default)
    {
        var channel = await _db.AiCardChannels
            .AsNoTracking()
            .Include(c => c.AiCard)
                .ThenInclude(a => a!.LlmCatalog)
            .Include(c => c.AiCard)
                .ThenInclude(a => a!.TtsCatalog)
            .FirstOrDefaultAsync(c => c.ChannelId == channelId && c.IsActive, ct);

        var card = channel?.AiCard;
        if (card is null)
        {
            _logger.LogDebug("[AiCardChannelQueryService] No active channel mapping for {Channel}", channelId);
            return null;
        }

        return ToContext(card);
    }

    public async Task<AiCardChannelContext?> ResolveByCardIdAsync(
        Guid cardId,
        CancellationToken ct = default)
    {
        var card = await _db.AiCards
            .AsNoTracking()
            .Include(a => a.LlmCatalog)
            .Include(a => a.TtsCatalog)
            .FirstOrDefaultAsync(a => a.Id == cardId && a.DeletedAt == null, ct);

        if (card is null)
        {
            _logger.LogDebug("[AiCardChannelQueryService] Card {CardId} not found", cardId);
            return null;
        }

        return ToContext(card);
    }


    private static AiCardChannelContext ToContext(Domain.Entities.AiCard card) =>
        new(
            AiCardId:                card.Id,
            UserId:                  card.UserId,
            SystemPrompt:            card.SystemPrompt,
            Personality:             card.Personality,
            LlmProvider:             card.LlmCatalog?.Provider,
            LlmModelId:              card.LlmCatalog?.ModelId,
            LlmConfig:               LlmConfigSettings.Parse(card.LlmConfig),
            TtsConfig:               TtsConfigSettings.Parse(card.TtsConfig),
            Behavior:                ResponseBehaviorSettings.Parse(card.ResponseBehavior),
            Memory:                  MemoryConfigSettings.Parse(card.MemorySettings),
            PersonalityConfig:       card.PersonalityConfig,
            ScreenAwarenessEnabled:  ScreenAwarenessCardSettings.Parse(card.ScreenAwarenessSettings).Enabled);

}
