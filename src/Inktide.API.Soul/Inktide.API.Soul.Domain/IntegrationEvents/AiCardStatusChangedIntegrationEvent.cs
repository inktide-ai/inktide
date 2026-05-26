using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Domain.IntegrationEvents;

public sealed record AiCardStatusChangedIntegrationEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid CardId,
    bool IsActive,
    string Status) : IIntegrationEvent;
