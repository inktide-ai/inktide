using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.Events;

public sealed record AiCardMoodShiftedEvent(
    Guid CardId,
    float OldValence,
    float NewValence,
    float OldArousal,
    float NewArousal) : IDomainEvent;
