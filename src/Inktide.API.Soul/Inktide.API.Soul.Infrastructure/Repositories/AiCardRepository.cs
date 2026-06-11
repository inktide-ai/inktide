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
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<AiCard?> GetByIdWithRelationsAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Include(c => c.TtsCatalog)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<IReadOnlyList<AiCard>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.SortKey)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AiCard>> GetSummaryListByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.SortKey)
            .ToListAsync(ct);
    }

    public async Task<(IReadOnlyList<AiCard> Items, bool HasMore)> GetSummaryListPagedAsync(
        Guid userId, int limit, string? cursor, CancellationToken ct = default)
    {
        var q = _db.AiCards
            .AsNoTracking()
            .Include(c => c.LlmCatalog)
            .Where(c => c.UserId == userId);

        if (cursor is not null)
        {
            var cur = cursor;
            q = q.Where(c => c.SortKey.CompareTo(cur) > 0);
        }

        var rows = await q
            .OrderBy(c => c.SortKey)
            .Take(limit + 1)
            .ToListAsync(ct);

        var hasMore = rows.Count > limit;
        return (rows.Take(limit).ToList(), hasMore);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards.CountAsync(c => c.UserId == userId, ct);
    }

    public Task<AiCard> CreateAsync(AiCard card, CancellationToken ct = default)
    {
        _db.AiCards.Add(card);
        return Task.FromResult(card);
    }

    public Task UpdateAsync(AiCard card, CancellationToken ct = default)
    {
        _db.AiCards.Update(card);
        // AvatarUrl and BannerUrl have dedicated atomic update methods (SetAvatarUrlAsync,
        // SetBannerUrlAsync). Exclude them here so a concurrent upload is never silently
        // overwritten when the caller loaded the card before the upload completed.
        _db.Entry(card).Property(c => c.AvatarUrl).IsModified  = false;
        _db.Entry(card).Property(c => c.BannerUrl).IsModified  = false;
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var card = await _db.AiCards.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return;

        card.SoftDelete(_time.GetUtcNow().UtcDateTime);
    }

    public async Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default)
    {
        var query = _db.AiCards.Where(c => c.UserId == userId && c.Slug == slug);
        if (excludeCardId.HasValue)
            query = query.Where(c => c.Id != excludeCardId.Value);
        return await query.AnyAsync(ct);
    }

    public async Task<AiCard?> GetPublicBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug, ct);
    }

    public async Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _db.AiCards
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.SortKey)
            .Select(c => new { c.Id, c.SortKey })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return rows.Select(r => (r.Id, r.SortKey)).ToList();
    }

    public Task SetAvatarUrlAsync(Guid cardId, string? avatarUrl, DateTime updatedAt, CancellationToken ct = default)
        => _db.AiCards
              .Where(c => c.Id == cardId)
              .ExecuteUpdateAsync(s => s
                  .SetProperty(c => c.AvatarUrl, avatarUrl)
                  .SetProperty(c => c.UpdatedAt, updatedAt), ct);

    public Task SetBannerUrlAsync(Guid cardId, string? bannerUrl, DateTime updatedAt, CancellationToken ct = default)
        => _db.AiCards
              .Where(c => c.Id == cardId)
              .ExecuteUpdateAsync(s => s
                  .SetProperty(c => c.BannerUrl, bannerUrl)
                  .SetProperty(c => c.UpdatedAt, updatedAt), ct);

    public async Task BulkUpdateSortKeysAsync(Guid userId, IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default)
    {
        if (updates.Count == 0) return;

        var ids    = updates.Select(u => u.Id).ToHashSet();
        var keyMap = updates.ToDictionary(u => u.Id, u => u.SortKey);

        var cards = await _db.AiCards
            .Where(c => ids.Contains(c.Id) && c.UserId == userId)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        foreach (var card in cards)
        {
            card.SortKey   = keyMap[card.Id];
            card.UpdatedAt = updatedAt;
        }
    }

}
