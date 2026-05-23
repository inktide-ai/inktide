using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.Events;

public sealed record AiCardDeletedEvent(Guid CardId, Guid UserId) : IDomainEvent;
