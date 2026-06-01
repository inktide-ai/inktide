using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.ActivityFeed.Handlers;

internal sealed class KnowledgeGainedFeedHandler : IDomainEventHandler<AiCardKnowledgeGainedEvent>
{
    private readonly ISoulActivityFeedRepository _repo;

    public KnowledgeGainedFeedHandler(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task HandleAsync(AiCardKnowledgeGainedEvent evt, CancellationToken ct)
    {
        // FANS_ONLY: topic-level knowledge events are visible to followers only (V2 auth check)
        ActivityCopyTemplates.TryGet("knowledge.default", out string emoji, out string copy);

        await _repo.AddAsync(new SoulActivityFeedEvent
        {
            Id           = Guid.NewGuid(),
            AiCardId     = evt.CardId,
            EventType    = "KNOWLEDGE_GAINED",
            Visibility   = "FANS_ONLY",
            Emoji        = emoji,
            RenderedCopy = copy,
            MetadataJson = $"{{\"topic\":\"{evt.Topic.Replace("\"", "\\\"")}\"}}",
            OccurredAt   = DateTime.UtcNow,
        }, ct).ConfigureAwait(false);
    }
}
