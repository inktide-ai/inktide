using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class CardSummaryProvider : ICardSummaryProvider
{
    private readonly ProjectDbContext _db;

    public CardSummaryProvider(ProjectDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyDictionary<Guid, CardSummary>> GetSummariesAsync(
        IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var arr = ids.Distinct().ToArray();
        if (arr.Length == 0)
            return new Dictionary<Guid, CardSummary>();

        return await _db.CardSummaries
            .Where(c => arr.Contains(c.Id))
            .ToDictionaryAsync(
                c => c.Id,
                c => new CardSummary(c.Id, c.Name, c.AvatarUrl),
                ct);
    }
}
