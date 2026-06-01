using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.ActivityFeed.Handlers;

internal sealed class MilestoneFeedHandler : IDomainEventHandler<AiCardMilestoneReachedEvent>
{
    private readonly ISoulActivityFeedRepository _repo;

    public MilestoneFeedHandler(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task HandleAsync(AiCardMilestoneReachedEvent evt, CancellationToken ct)
    {
        string templateKey = evt.MilestoneName switch
        {
            "1k"  => "milestone.1k",
            "5k"  => "milestone.5k",
            "10k" => "milestone.10k",
            "50k" => "milestone.50k",
            _     => "milestone.default",
        };

        ActivityCopyTemplates.TryGet(templateKey, out string emoji, out string copy);

        await _repo.AddAsync(new SoulActivityFeedEvent
        {
            Id           = Guid.NewGuid(),
            AiCardId     = evt.CardId,
            EventType    = "MILESTONE",
            Visibility   = "PUBLIC",
            Emoji        = emoji,
            RenderedCopy = copy,
            MetadataJson = $"{{\"milestone\":\"{evt.MilestoneName}\"}}",
            OccurredAt   = DateTime.UtcNow,
        }, ct).ConfigureAwait(false);
    }
}
