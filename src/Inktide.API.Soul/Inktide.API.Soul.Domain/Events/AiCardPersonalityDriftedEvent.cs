using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.Events;

public sealed record AiCardPersonalityDriftedEvent(
    Guid CardId,
    string TraitName,
    string Direction) : IDomainEvent;
