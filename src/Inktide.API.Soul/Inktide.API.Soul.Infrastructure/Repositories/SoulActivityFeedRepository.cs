using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

internal sealed class SoulActivityFeedRepository : ISoulActivityFeedRepository
{
    private readonly SoulDbContext _db;

    public SoulActivityFeedRepository(SoulDbContext db)
        => _db = db ?? throw new ArgumentNullException(nameof(db));

    public async Task AddAsync(SoulActivityFeedEvent feedEvent, CancellationToken ct = default)
    {
        _db.SoulActivityFeedEvents.Add(feedEvent);
        // No SaveChangesAsync - the outer ITransactionManager commits the unit of work.
    }

    public async Task<IReadOnlyList<SoulActivityFeedEvent>> GetPublicPageAsync(
        Guid aiCardId,
        IReadOnlyList<string> visibilityTiers,
        int limit,
        DateTime? cursorOccurredAt,
        CancellationToken ct = default)
    {
        // CTE ranks MOOD_SHIFT events per UTC calendar day globally (before cursor),
        // then applies the cursor as a keyset filter on the already-ranked/filtered set.
        // This ensures the 3-per-day cap is correct across page boundaries.
        string[] tiers = [.. visibilityTiers];

        var result = await _db.SoulActivityFeedEvents.FromSql(
            $"""
            WITH ranked AS (
                SELECT *,
                    CASE WHEN event_type = 'MOOD_SHIFT'
                         THEN ROW_NUMBER() OVER (
                             PARTITION BY ai_card_id, DATE(occurred_at AT TIME ZONE 'UTC')
                             ORDER BY occurred_at DESC
                         )
                         ELSE 0
                    END AS daily_mood_rank
                FROM soul.soul_activity_feed
                WHERE ai_card_id = {aiCardId}
                  AND visibility = ANY({tiers})
                  AND occurred_at > NOW() - INTERVAL '90 days'
            ),
            filtered AS (
                SELECT id, ai_card_id, event_type, visibility, emoji, rendered_copy, metadata, occurred_at
                FROM ranked
                WHERE event_type != 'MOOD_SHIFT' OR daily_mood_rank <= 3
            )
            SELECT * FROM filtered
            WHERE ({cursorOccurredAt}::timestamptz IS NULL OR occurred_at < {cursorOccurredAt}::timestamptz)
            ORDER BY occurred_at DESC
            LIMIT {limit}
            """)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return result;
    }

    public async Task<DateTime?> GetLastEventTimeAsync(Guid aiCardId, string eventType, CancellationToken ct = default)
    {
        return await _db.SoulActivityFeedEvents
            .AsNoTracking()
            .Where(e => e.AiCardId == aiCardId && e.EventType == eventType)
            .OrderByDescending(e => e.OccurredAt)
            .Select(e => (DateTime?)e.OccurredAt)
            .FirstOrDefaultAsync(ct)
            .ConfigureAwait(false);
    }
}
