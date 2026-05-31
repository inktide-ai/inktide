using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

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
            .OrderBy(c => c.SortKey)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AiCard>> GetSummaryListByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        // AsSplitQuery prevents a Cartesian explosion when joining LlmCatalog + Channels in one query.
        // Global query filter (DeletedAt == null) is applied automatically.
        return await _db.AiCards
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.LlmCatalog)
            .Include(c => c.Channels.Where(ch => ch.IsActive))
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.SortKey)
            .ToListAsync(ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AiCards.CountAsync(c => c.UserId == userId && c.DeletedAt == null, ct);
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
        var card = await _db.AiCards.FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null, ct);
        if (card is null) return;

        card.SoftDelete(_time.GetUtcNow().UtcDateTime);
    }

    public async Task<bool> SlugExistsAsync(Guid userId, string slug, Guid? excludeCardId = null, CancellationToken ct = default)
    {
        var query = _db.AiCards.Where(c => c.UserId == userId && c.Slug == slug && c.DeletedAt == null);
        if (excludeCardId.HasValue)
            query = query.Where(c => c.Id != excludeCardId.Value);
        return await query.AnyAsync(ct);
    }

    public async Task<AiCard?> GetPublicBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _db.AiCards
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Channels.Where(ch => ch.IsActive))
            .FirstOrDefaultAsync(c => c.Slug == slug && c.DeletedAt == null, ct);
    }

    public async Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _db.AiCards
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.DeletedAt == null)
            .OrderBy(c => c.SortKey)
            .Select(c => new { c.Id, c.SortKey })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return rows.Select(r => (r.Id, r.SortKey)).ToList();
    }

    public Task SetAvatarUrlAsync(Guid cardId, string? avatarUrl, DateTime updatedAt, CancellationToken ct = default)
        => _db.AiCards
              .Where(c => c.Id == cardId && c.DeletedAt == null)
              .ExecuteUpdateAsync(s => s
                  .SetProperty(c => c.AvatarUrl, avatarUrl)
                  .SetProperty(c => c.UpdatedAt, updatedAt), ct);

    public Task SetBannerUrlAsync(Guid cardId, string? bannerUrl, DateTime updatedAt, CancellationToken ct = default)
        => _db.AiCards
              .Where(c => c.Id == cardId && c.DeletedAt == null)
              .ExecuteUpdateAsync(s => s
                  .SetProperty(c => c.BannerUrl, bannerUrl)
                  .SetProperty(c => c.UpdatedAt, updatedAt), ct);

    public async Task BulkUpdateSortKeysAsync(Guid userId, IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default)
    {
        if (updates.Count == 0) return;

        var ids  = updates.Select(u => u.Id).ToArray();
        var keys = updates.Select(u => u.SortKey).ToArray();

        await _db.Database.ExecuteSqlRawAsync(
            @"UPDATE soul.ai_cards
              SET sort_key = v.sort_key, updated_at = @updated_at
              FROM UNNEST(@ids, @keys) AS v(id uuid, sort_key text)
              WHERE soul.ai_cards.id = v.id
                AND soul.ai_cards.user_id = @user_id",
            new NpgsqlParameter("ids",        NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = ids },
            new NpgsqlParameter("keys",       NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = keys },
            new NpgsqlParameter("updated_at", NpgsqlDbType.Timestamp)                 { Value = updatedAt },
            new NpgsqlParameter("user_id",    NpgsqlDbType.Uuid)                      { Value = userId })
            .ConfigureAwait(false);
    }

}
