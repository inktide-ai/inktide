using Inktide.API.Soul.Application.ActivityFeed;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Services;

internal sealed class SoulActivityFeedService : ISoulActivityFeedService
{
    private readonly ISoulActivityFeedRepository _repo;

    public SoulActivityFeedService(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task<SoulActivityFeedPage> GetPublicPageAsync(
        Guid aiCardId, int limit, string? encodedCursor, CancellationToken ct)
    {
        int capped = Math.Clamp(limit, 1, 50);
        DateTime? cursor = CursorCodec.Decode(encodedCursor);

        var rows = await _repo.GetPublicPageAsync(
            aiCardId, ["PUBLIC"], capped + 1, cursor, ct).ConfigureAwait(false);

        bool hasMore = rows.Count > capped;
        var items    = (hasMore ? rows.Take(capped) : rows).Select(ToEntry).ToList();
        string? nextCursor = hasMore
            ? CursorCodec.Encode(items[^1].OccurredAt, items[^1].Id)
            : null;

        return new SoulActivityFeedPage(items, nextCursor);
    }

    private static SoulActivityFeedEntry ToEntry(Domain.Entities.SoulActivityFeedEvent e) =>
        new(e.Id, e.EventType, e.Visibility, e.Emoji, e.RenderedCopy, e.OccurredAt);
}
