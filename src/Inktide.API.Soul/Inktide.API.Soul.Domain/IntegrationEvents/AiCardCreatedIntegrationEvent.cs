using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.IntegrationEvents;

public sealed record AiCardCreatedIntegrationEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid CardId,
    Guid UserId,
    string CardName) : IIntegrationEvent;
