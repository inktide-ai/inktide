using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.Events;

public sealed record AiCardAppearanceChangedEvent(
    Guid CardId,
    string ChangeDescription) : IDomainEvent;
