using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Events;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.ActivityFeed.Handlers;

internal sealed class MoodShiftFeedHandler : IDomainEventHandler<AiCardMoodShiftedEvent>
{
    private readonly ISoulActivityFeedRepository _repo;

    public MoodShiftFeedHandler(ISoulActivityFeedRepository repo)
        => _repo = repo ?? throw new ArgumentNullException(nameof(repo));

    public async Task HandleAsync(AiCardMoodShiftedEvent evt, CancellationToken ct)
    {
        var lastEventAt = await _repo.GetLastEventTimeAsync(evt.CardId, "MOOD_SHIFT", ct).ConfigureAwait(false);
        var gate = VadEventGate.Evaluate(evt.OldValence, evt.NewValence, evt.NewArousal, lastEventAt, DateTime.UtcNow);
        if (!gate.ShouldEmit) return;

        ActivityCopyTemplates.TryGet(gate.TemplateKey!, out string emoji, out string copy);

        await _repo.AddAsync(new SoulActivityFeedEvent
        {
            Id           = Guid.NewGuid(),
            AiCardId     = evt.CardId,
            EventType    = "MOOD_SHIFT",
            Visibility   = "PUBLIC",
            Emoji        = emoji,
            RenderedCopy = copy,
            MetadataJson = $"{{\"old_valence\":{evt.OldValence:F3},\"new_valence\":{evt.NewValence:F3},\"old_arousal\":{evt.OldArousal:F3},\"new_arousal\":{evt.NewArousal:F3}}}",
            OccurredAt   = DateTime.UtcNow,
        }, ct).ConfigureAwait(false);
    }
}
