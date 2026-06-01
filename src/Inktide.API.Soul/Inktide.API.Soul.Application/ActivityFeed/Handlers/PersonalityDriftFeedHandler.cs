using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.ActivityFeed.Handlers;

internal sealed class PersonalityDriftFeedHandler : IDomainEventHandler<AiCardPersonalityDriftedEvent>
{
    private readonly ISoulActivityFeedRepository _repo;

    public PersonalityDriftFeedHandler(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task HandleAsync(AiCardPersonalityDriftedEvent evt, CancellationToken ct)
    {
        string templateKey = evt.Direction.Equals("up", StringComparison.OrdinalIgnoreCase)
            ? "drift.warmer"
            : evt.Direction.Equals("down", StringComparison.OrdinalIgnoreCase)
                ? "drift.cooler"
                : "drift.default";

        ActivityCopyTemplates.TryGet(templateKey, out string emoji, out string copy);

        await _repo.AddAsync(new SoulActivityFeedEvent
        {
            Id           = Guid.NewGuid(),
            AiCardId     = evt.CardId,
            EventType    = "PERSONALITY_DRIFT",
            Visibility   = "FANS_ONLY",
            Emoji        = emoji,
            RenderedCopy = copy,
            MetadataJson = $"{{\"trait\":\"{evt.TraitName.Replace("\"", "\\\"")}\"}}",
            OccurredAt   = DateTime.UtcNow,
        }, ct).ConfigureAwait(false);
    }
}
