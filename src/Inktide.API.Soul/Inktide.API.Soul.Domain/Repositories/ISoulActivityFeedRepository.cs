using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface ISoulActivityFeedRepository
{
    Task AddAsync(SoulActivityFeedEvent feedEvent, CancellationToken ct = default);

    Task<IReadOnlyList<SoulActivityFeedEvent>> GetPublicPageAsync(
        Guid aiCardId,
        IReadOnlyList<string> visibilityTiers,
        int limit,
        DateTime? cursorOccurredAt,
        CancellationToken ct = default);

    Task<DateTime?> GetLastEventTimeAsync(Guid aiCardId, string eventType, CancellationToken ct = default);
}
