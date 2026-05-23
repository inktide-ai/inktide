using Inktide.API.Core.Transactions;

namespace Inktide.API.Core.Events;

public sealed record UserAccountDeletedEvent(Guid UserId) : IIntegrationEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
