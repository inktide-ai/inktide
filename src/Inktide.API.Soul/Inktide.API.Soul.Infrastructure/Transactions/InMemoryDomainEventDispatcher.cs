using Inktide.API.Core.Transactions;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.Soul.Infrastructure.Transactions;

internal sealed class InMemoryDomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;

    public InMemoryDomainEventDispatcher(IServiceProvider serviceProvider)
        => _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    public async Task DispatchAsync(IReadOnlyList<IDomainEvent> events, CancellationToken ct)
    {
        foreach (var evt in events)
        {
            var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(evt.GetType());
            var method      = handlerType.GetMethod("HandleAsync")!;
            foreach (var handler in _serviceProvider.GetServices(handlerType))
                await ((Task)method.Invoke(handler, [evt, ct])!).ConfigureAwait(false);
        }
    }
}
