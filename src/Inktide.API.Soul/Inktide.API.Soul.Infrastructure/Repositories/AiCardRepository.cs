using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardRepository : IAiCardRepository
{

    private readonly SoulDbContext _db;
    private readonly TimeProvider _time;


    public AiCardRepository(SoulDbContext db, TimeProvider time)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }


    public async Task<AiCard?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null, ct);
    }

    public async Task<AiCard?> GetByIdWithRelationsAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.LlmCatalog)
            .Include(c => c.TtsCatalog)
            .Include(c => c.Channels)
            .Include(c => c.Tools)
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null, ct);
    }

    public async Task<IReadOnlyList<AiCard>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Where(c => c.UserId == userId && c.DeletedAt == null)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards.CountAsync(c => c.UserId == userId && c.DeletedAt == null, ct);
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
        var card = await _db.AiCards.FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null, ct);
        if (card is null) return;

        card.DeletedAt = _time.GetUtcNow().UtcDateTime;
        card.UpdatedAt = _time.GetUtcNow().UtcDateTime;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default)
    {
        var query = _db.AiCards.Where(c => c.UserId == userId && c.Slug == slug && c.DeletedAt == null);
        if (excludeCardId.HasValue)
            query = query.Where(c => c.Id != excludeCardId.Value);
        return await query.AnyAsync(ct);
    }

}
