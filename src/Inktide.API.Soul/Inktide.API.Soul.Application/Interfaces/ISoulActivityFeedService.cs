namespace Inktide.API.Soul.Application.Interfaces;

public interface ISoulActivityFeedService
{
    Task<SoulActivityFeedPage> GetPublicPageAsync(
        Guid aiCardId,
        int limit,
        string? encodedCursor,
        CancellationToken ct = default);
}

public sealed record SoulActivityFeedPage(
    IReadOnlyList<SoulActivityFeedEntry> Items,
    string? NextCursor);

public sealed record SoulActivityFeedEntry(
    Guid Id,
    string EventType,
    string Visibility,
    string Emoji,
    string RenderedCopy,
    DateTime OccurredAt);
