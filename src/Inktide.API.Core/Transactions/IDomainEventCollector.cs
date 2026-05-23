namespace Inktide.API.Core.Transactions;

public interface IDomainEventCollector
{
    void Add(IDomainEvent domainEvent);
    void Add(IIntegrationEvent integrationEvent);
    IReadOnlyList<IDomainEvent> DomainEvents { get; }
    IReadOnlyList<IIntegrationEvent> IntegrationEvents { get; }
    void Clear();
}
