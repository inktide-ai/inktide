using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.ActivityFeed.Handlers;

internal sealed class AppearanceChangeFeedHandler : IDomainEventHandler<AiCardAppearanceChangedEvent>
{
    private readonly ISoulActivityFeedRepository _repo;

    public AppearanceChangeFeedHandler(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task HandleAsync(AiCardAppearanceChangedEvent evt, CancellationToken ct)
    {
        string templateKey = evt.ChangeDescription.Contains("outfit", StringComparison.OrdinalIgnoreCase)
            ? "appearance.outfit"
            : evt.ChangeDescription.Contains("access", StringComparison.OrdinalIgnoreCase)
                ? "appearance.accessory"
                : "appearance.default";

        ActivityCopyTemplates.TryGet(templateKey, out string emoji, out string copy);

        await _repo.AddAsync(new SoulActivityFeedEvent
        {
            Id           = Guid.NewGuid(),
            AiCardId     = evt.CardId,
            EventType    = "APPEARANCE_CHANGE",
            Visibility   = "PUBLIC",
            Emoji        = emoji,
            RenderedCopy = copy,
            MetadataJson = $"{{\"change\":\"{evt.ChangeDescription.Replace("\"", "\\\"")}\"}}",
            OccurredAt   = DateTime.UtcNow,
        }, ct).ConfigureAwait(false);
    }
}
