using System.Text.RegularExpressions;
using Chimera.API.Soul.Application.Exceptions;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Application.Services;

public sealed partial class AiCardService : IAiCardService
{
    #region Fields

    private readonly IAiCardRepository _cardRepo;
    private readonly IAuditLogRepository _auditLog;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardService> _logger;

    #endregion

    #region Constructors

    public AiCardService(
        IAiCardRepository cardRepo,
        IAuditLogRepository auditLog,
        TimeProvider time,
        ILogger<AiCardService> logger)
    {
        _cardRepo = cardRepo ?? throw new ArgumentNullException(nameof(cardRepo));
        _auditLog = auditLog ?? throw new ArgumentNullException(nameof(auditLog));
        _time = time ?? throw new ArgumentNullException(nameof(time));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task<AiCard> CreateAsync(Guid userId, AiCard card, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(card);

        card.UserId = userId;
        card.Slug = GenerateSlug(card.Name);

        if (await _cardRepo.SlugExistsAsync(userId, card.Slug, ct: ct))
            card.Slug += "-" + Guid.NewGuid().ToString("N")[..6];

        var now = _time.GetUtcNow().UtcDateTime;
        card.Id = Guid.NewGuid();
        card.CreatedAt = now;
        card.UpdatedAt = now;
        card.IsActive = true;

        var created = await _cardRepo.CreateAsync(card, ct);

        await _auditLog.LogAsync(userId, "ai_card", created.Id, "created", ct: ct);
        _logger.LogInformation("AI card {CardId} created for user {UserId}", created.Id, userId);

        return created;
    }

    public async Task<AiCard?> GetByIdAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdWithRelationsAsync(cardId, ct);
        if (card is null || card.UserId != userId)
            return null;
        return card;
    }

    public async Task<IReadOnlyList<AiCard>> GetAllByUserAsync(Guid userId, CancellationToken ct = default)
    {
        return await _cardRepo.GetByUserIdAsync(userId, ct);
    }

    public async Task<AiCard> UpdateAsync(Guid userId, AiCard card, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(card);
        var existing = await _cardRepo.GetByIdAsync(card.Id, ct)
            ?? throw new AiCardNotFoundException(card.Id);

        if (existing.UserId != userId)
            throw new AiCardNotFoundException(card.Id);

        if (card.Slug != existing.Slug && await _cardRepo.SlugExistsAsync(userId, card.Slug, card.Id, ct))
            throw new SlugAlreadyExistsException(card.Slug);

        card.UserId = userId;
        card.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        card.CreatedAt = existing.CreatedAt;

        await _cardRepo.UpdateAsync(card, ct);
        await _auditLog.LogAsync(userId, "ai_card", card.Id, "updated", ct: ct);

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
    }

    #endregion

    #region Private Methods

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant().Trim();
        slug = SlugInvalidChars().Replace(slug, "");
        slug = SlugWhitespace().Replace(slug, "-");
        slug = slug.Trim('-');
        return string.IsNullOrEmpty(slug) ? "ai-card" : slug;
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex SlugInvalidChars();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SlugWhitespace();

    #endregion
}
