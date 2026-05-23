using Inktide.API.Core.Transactions;

namespace Inktide.API.Soul.Infrastructure.Transactions;

internal sealed class DomainEventCollector : IDomainEventCollector
{
    private readonly List<IDomainEvent> _domain = [];
    private readonly List<IIntegrationEvent> _integration = [];

    public void Add(IDomainEvent e) => _domain.Add(e);
    public void Add(IIntegrationEvent e) => _integration.Add(e);
    public IReadOnlyList<IDomainEvent> DomainEvents => _domain;
    public IReadOnlyList<IIntegrationEvent> IntegrationEvents => _integration;
    public void Clear() { _domain.Clear(); _integration.Clear(); }
}
