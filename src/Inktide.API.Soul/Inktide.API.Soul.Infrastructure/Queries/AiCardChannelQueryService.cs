using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.ValueObjects;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Infrastructure.Queries;

/// <summary>
/// Resolves AI card identity + provider config for Synapse channel routing.
/// AiCardChannel has moved to the Project context — channel-by-ID resolution always returns null
/// until Synapse is updated to query the Project context directly.
/// Card-by-ID resolution still works for the inktide-chat fallback path.
/// </summary>
public sealed class AiCardChannelQueryService : IAiCardChannelQueryService
{

    private readonly SoulDbContext _db;
    private readonly ILogger<AiCardChannelQueryService> _logger;

    public AiCardChannelQueryService(SoulDbContext db, ILogger<AiCardChannelQueryService> logger)
    {
        _db     = db     ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public Task<AiCardChannelContext?> ResolveByChannelIdAsync(
        string channelId,
        CancellationToken ct = default)
    {
        // AiCardChannel has moved to the Project context.
        // Synapse will need to query the Project context for channel routing.
        _logger.LogDebug(
            "[AiCardChannelQueryService] ResolveByChannelId is a no-op — channels moved to Project context. Channel={Channel}",
            channelId);
        return Task.FromResult<AiCardChannelContext?>(null);
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

        return new AiCardChannelContext(
            AiCardId:           card.Id,
            UserId:             card.UserId,
            LlmProvider:        card.LlmCatalog?.Provider,
            LlmModelId:         card.LlmCatalog?.ModelId,
            LlmConfig:          LlmConfigSettings.Parse(card.LlmConfig),
            TtsConfig:          TtsConfigSettings.Parse(card.TtsConfig),
            LlmRequiresApiKey:  card.LlmCatalog?.RequiresApiKey ?? true);
    }

}
