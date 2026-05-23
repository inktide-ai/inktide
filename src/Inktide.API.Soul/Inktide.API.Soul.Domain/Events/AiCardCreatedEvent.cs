using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.Events;

public sealed record AiCardCreatedEvent(Guid CardId, Guid UserId) : IDomainEvent;
