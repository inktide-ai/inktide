using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

public sealed class AiCardRepository : IAiCardRepository
{
    #region Fields

    private readonly SoulDbContext _db;
    private readonly TimeProvider _time;

    #endregion

    #region Constructors

    public AiCardRepository(SoulDbContext db, TimeProvider time)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }

    #endregion

    #region Public Methods

    public async Task<AiCard?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive, ct);
    }

    public async Task<AiCard?> GetByIdWithRelationsAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Include(c => c.TtsCatalog)
            .Include(c => c.Channels)
            .Include(c => c.Tools)
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive, ct);
    }

    public async Task<IReadOnlyList<AiCard>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards.CountAsync(c => c.UserId == userId && c.IsActive, ct);
    }

    public async Task<AiCard> CreateAsync(AiCard card, CancellationToken ct = default)
    {
        _db.AiCards.Add(card);
        await _db.SaveChangesAsync(ct);
        return card;
    }

    public async Task UpdateAsync(AiCard card, CancellationToken ct = default)
    {
        _db.AiCards.Update(card);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var card = await _db.AiCards.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return;

        card.IsActive = false;
        card.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default)
    {
        var query = _db.AiCards.Where(c => c.UserId == userId && c.Slug == slug && c.IsActive);
        if (excludeCardId.HasValue)
            query = query.Where(c => c.Id != excludeCardId.Value);
        return await query.AnyAsync(ct);
    }

    #endregion
}
