using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.IntegrationEvents;

public sealed record AiCardDeletedIntegrationEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid CardId,
    Guid UserId) : IIntegrationEvent;
