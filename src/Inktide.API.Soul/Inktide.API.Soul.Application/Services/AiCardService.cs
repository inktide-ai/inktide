using Inktide.API.Core.Generators;
using Inktide.API.Core.Ordering;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Guards;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.IntegrationEvents;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

public sealed class AiCardService : IAiCardService
{
    private readonly IAiCardRepository _cardRepo;
    private readonly IAuditLogRepository _auditLog;
    private readonly IAiCardSlugService _slugService;
    private readonly ITransactionManager _txManager;
    private readonly IDomainEventCollector _events;
    private readonly SoulCreationGuard _creationGuard;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardService> _logger;

    public AiCardService(
        IAiCardRepository cardRepo,
        IAuditLogRepository auditLog,
        IAiCardSlugService slugService,
        ITransactionManager txManager,
        IDomainEventCollector events,
        SoulCreationGuard creationGuard,
        TimeProvider time,
        ILogger<AiCardService> logger)
    {
        _cardRepo      = cardRepo      ?? throw new ArgumentNullException(nameof(cardRepo));
        _auditLog      = auditLog      ?? throw new ArgumentNullException(nameof(auditLog));
        _slugService   = slugService   ?? throw new ArgumentNullException(nameof(slugService));
        _txManager     = txManager     ?? throw new ArgumentNullException(nameof(txManager));
        _events        = events        ?? throw new ArgumentNullException(nameof(events));
        _creationGuard = creationGuard ?? throw new ArgumentNullException(nameof(creationGuard));
        _time          = time          ?? throw new ArgumentNullException(nameof(time));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AiCard> CreateAsync(
        Guid userId,
        AiCard card,
        string? llmConfigProviderId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(card);

        await _creationGuard.EnsureCanCreateAsync(
            userId,
            card.LlmCatalogId,
            llmConfigProviderId,
            card.TtsCatalogId,
            ct);

        card.UserId = userId;
        card.Slug   = await _slugService.GenerateUniqueAsync(
            card.Name,
            s => _cardRepo.SlugExistsAsync(userId, s, ct: ct),
            ct);

        var sortKeys = await _cardRepo.GetSortKeysAsync(userId, ct).ConfigureAwait(false);
        card.SortKey = FractionalIndexer.GenerateKeyBetween(
            sortKeys.Count > 0 ? sortKeys[^1].SortKey : null, null);

        var now = _time.GetUtcNow().UtcDateTime;
        card.Id        = IdGenerator.New();
        card.CreatedAt = now;
        card.UpdatedAt = now;
        card.IsActive  = true;

        var created = await _cardRepo.CreateAsync(card, ct);
        await _auditLog.LogAsync(userId, "ai_card", created.Id, "created", ct: ct);

        _events.Add(new AiCardCreatedEvent(created.Id, userId));
        _events.Add(new AiCardCreatedIntegrationEvent(IdGenerator.New(), now, created.Id, userId, created.Name));

        await _txManager.SaveChangesAsync(ct);

        _logger.LogInformation("AI card {CardId} created for user {UserId}", created.Id, userId);
        return created;
    }

    public async Task<AiCard?> GetByIdAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdWithRelationsAsync(cardId, ct);
        if (card is null || card.UserId != userId) return null;
        return card;
    }

    public async Task<IReadOnlyList<AiCard>> GetAllByUserAsync(Guid userId, CancellationToken ct = default)
        => await _cardRepo.GetSummaryListByUserIdAsync(userId, ct);

    public async Task<AiCard> UpdateAsync(Guid userId, AiCard card, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(card);

        var existing = await _cardRepo.GetByIdAsync(card.Id, ct)
            ?? throw new AiCardNotFoundException(card.Id);

        if (existing.UserId != userId)
            throw new AiCardNotFoundException(card.Id);

        if (card.Slug != existing.Slug && await _cardRepo.SlugExistsAsync(userId, card.Slug, card.Id, ct))
            throw new SlugAlreadyExistsException(card.Slug);

        card.UserId    = userId;
        card.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        card.CreatedAt = existing.CreatedAt;

        await _cardRepo.UpdateAsync(card, ct);
        await _auditLog.LogAsync(userId, "ai_card", card.Id, "updated", ct: ct);

        _events.Add(new AiCardUpdatedEvent(card.Id, userId));
        await _txManager.SaveChangesAsync(ct);

        return card;
    }

    public async Task DeleteAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var existing = await _cardRepo.GetByIdAsync(cardId, ct)
            ?? throw new AiCardNotFoundException(cardId);

        if (existing.UserId != userId)
            throw new AiCardNotFoundException(cardId);

        await _cardRepo.DeleteAsync(cardId, ct);
        await _auditLog.LogAsync(userId, "ai_card", cardId, "deleted", ct: ct);

        _events.Add(new AiCardDeletedEvent(cardId, userId));
        _events.Add(new AiCardDeletedIntegrationEvent(IdGenerator.New(), _time.GetUtcNow().UtcDateTime, cardId, userId));
        await _txManager.SaveChangesAsync(ct);
    }

    public async Task<AiCard?> ReorderAsync(
        Guid userId, Guid cardId,
        Guid? previousId, Guid? nextId,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct).ConfigureAwait(false);
        if (card is null || card.UserId != userId) return null;

        var sortKeys = await _cardRepo.GetSortKeysAsync(userId, ct).ConfigureAwait(false);

        string? prevKey = previousId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == previousId.Value).SortKey
            : null;
        string? nextKey = nextId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == nextId.Value).SortKey
            : null;

        string newKey = FractionalIndexer.GenerateKeyBetween(prevKey, nextKey);

        await _cardRepo.BulkUpdateSortKeysAsync([(cardId, newKey)], ct).ConfigureAwait(false);

        card.SortKey = newKey;
        return card;
    }
}
