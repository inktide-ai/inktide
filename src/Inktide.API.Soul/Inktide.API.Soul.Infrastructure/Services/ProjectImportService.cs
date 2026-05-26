using System.Text.Json;
using Inktide.API.Soul.Application.Constants;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Infrastructure.DbContext;

namespace Inktide.API.Soul.Infrastructure.Services;

/// <summary>
/// Atomically creates an AiCard + writes a GraphImport OutboxEvent in a single transaction.
/// The outbox event is picked up by OutboxProcessorHostedService and delivered to Graph.Infrastructure.
/// </summary>
public sealed class ProjectImportService : IProjectImportService
{
    private readonly SoulDbContext _db;
    private readonly IAiCardService _cardService;

    public ProjectImportService(SoulDbContext db, IAiCardService cardService)
    {
        _db          = db          ?? throw new ArgumentNullException(nameof(db));
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
    }

    public async Task<AiCard> ImportAsync(
        Guid userId,
        AiCard card,
        string? graphPayloadJson,
        CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        // CreateAsync uses the same scoped SoulDbContext — its SaveChangesAsync participates in the open transaction.
        var created = await _cardService.CreateAsync(userId, card, ct: ct).ConfigureAwait(false);

        if (graphPayloadJson is not null)
        {
            var payload = JsonSerializer.Serialize(new
            {
                characterId = created.Id,
                userId,
                graphJson = graphPayloadJson,
            });

            _db.OutboxEvents.Add(new OutboxEvent
            {
                EventType = SoulEventTypes.GraphImport,
                Payload   = payload,
            });

            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        await tx.CommitAsync(ct).ConfigureAwait(false);
        return created;
    }
}
