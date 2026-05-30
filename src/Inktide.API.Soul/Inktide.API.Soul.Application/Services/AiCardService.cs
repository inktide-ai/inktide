using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Core.Ordering;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Guards;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.IntegrationEvents;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Domain.ValueObjects;
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
    private readonly IAiCardStatusGateCache _gateCache;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardService> _logger;

    public AiCardService(
        IAiCardRepository cardRepo,
        IAuditLogRepository auditLog,
        IAiCardSlugService slugService,
        ITransactionManager txManager,
        IDomainEventCollector events,
        SoulCreationGuard creationGuard,
        IAiCardStatusGateCache gateCache,
        TimeProvider time,
        ILogger<AiCardService> logger)
    {
        _cardRepo      = cardRepo      ?? throw new ArgumentNullException(nameof(cardRepo));
        _auditLog      = auditLog      ?? throw new ArgumentNullException(nameof(auditLog));
        _slugService   = slugService   ?? throw new ArgumentNullException(nameof(slugService));
        _txManager     = txManager     ?? throw new ArgumentNullException(nameof(txManager));
        _events        = events        ?? throw new ArgumentNullException(nameof(events));
        _creationGuard = creationGuard ?? throw new ArgumentNullException(nameof(creationGuard));
        _gateCache     = gateCache     ?? throw new ArgumentNullException(nameof(gateCache));
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
        // Preserve the DB-current AvatarUrl so a concurrent avatar upload is never
        // overwritten by a stale value carried in `card` from a controller-level read.
        // Safe: avatar uploads now go through SetAvatarUrlAsync, not this method.
        card.AvatarUrl = existing.AvatarUrl;

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

        await _cardRepo.BulkUpdateSortKeysAsync(userId, [(cardId, newKey)], _time.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);

        card.SortKey = newKey;
        return card;
    }

    public async Task<AiCard?> ChangeStatusAsync(Guid userId, Guid cardId, bool isActive, AiCardStatus status, CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct).ConfigureAwait(false);
        if (card is null || card.UserId != userId) return null;

        card.IsActive  = isActive;
        card.Status    = status;
        card.UpdatedAt = _time.GetUtcNow().UtcDateTime;

        await _cardRepo.UpdateAsync(card, ct).ConfigureAwait(false);

        if (isActive && status == AiCardStatus.Active)
            await _gateCache.UnblockAsync(cardId, ct).ConfigureAwait(false);
        else
            await _gateCache.BlockAsync(cardId, ct).ConfigureAwait(false);

        _events.Add(new AiCardStatusChangedIntegrationEvent(
            IdGenerator.New(), _time.GetUtcNow().UtcDateTime, cardId, isActive, status.ToString()));

        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);

        _logger.LogInformation("Soul {CardId} status changed: IsActive={IsActive}, Status={Status}", cardId, isActive, status);
        return card;
    }

    public async Task<Guid> CreateFromImportAsync(Guid userId, ImportSoulCommand cmd, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(cmd);

        var card = new AiCard
        {
            Name             = cmd.Name,
            Personality      = cmd.Personality,
            SystemPrompt     = cmd.SystemPrompt,
            Description      = cmd.Description,
            Status           = Enum.TryParse<AiCardStatus>(cmd.Status, ignoreCase: true, out var st)
                                   ? st : AiCardStatus.Active,
            LlmCatalogId     = cmd.LlmCatalogId,
            LlmConfig        = cmd.LlmConfig,
            TtsCatalogId     = cmd.TtsCatalogId,
            TtsConfig        = cmd.TtsConfig,
            Appearance       = cmd.Appearance,
            ResponseBehavior = cmd.ResponseBehavior,
            MemorySettings   = cmd.MemorySettings,
            AutoPilot        = cmd.AutoPilot,
            PersonalityConfig = PersonalitySettings.Parse(cmd.PersonalityConfigJson),
        };

        var created = await CreateAsync(userId, card, ct: ct).ConfigureAwait(false);
        return created.Id;
    }
}
