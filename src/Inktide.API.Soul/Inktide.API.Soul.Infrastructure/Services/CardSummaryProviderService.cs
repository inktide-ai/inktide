using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Services;

internal sealed class CardSummaryProviderService : ICardSummaryProvider
{
    private readonly SoulDbContext _db;

    public CardSummaryProviderService(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyDictionary<Guid, CardSummary>> GetSummariesAsync(
        IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var idList = ids.ToList();
        if (idList.Count == 0) return new Dictionary<Guid, CardSummary>();

        var rows = await _db.AiCards
            .Where(c => idList.Contains(c.Id))
            .Select(c => new { c.Id, c.Name, c.AvatarUrl })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return rows.ToDictionary(
            r => r.Id,
            r => new CardSummary(r.Id, r.Name, r.AvatarUrl));
    }
}
