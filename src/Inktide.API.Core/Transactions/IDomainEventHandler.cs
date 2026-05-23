namespace Inktide.API.Core.Transactions;

public interface IDomainEventHandler<in T> where T : IDomainEvent
{
    Task HandleAsync(T domainEvent, CancellationToken ct = default);
}
