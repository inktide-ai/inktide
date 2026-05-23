using Inktide.API.Graph.Domain.Contracts;

namespace Inktide.API.Graph.Infrastructure.Registry;

public sealed class NodeHandlerRegistry : INodeHandlerRegistry
{
    private readonly IReadOnlyDictionary<(string Type, string ProviderId), INodeHandler> _index;

    public NodeHandlerRegistry(IEnumerable<INodeHandler> handlers)
    {
        _index = handlers.ToDictionary(h => (h.Type, h.ProviderId));
    }

    public INodeHandler Get(string type, string providerId)
    {
        if (_index.TryGetValue((type, providerId), out var handler))
            return handler;

        throw new InvalidOperationException(
            $"No node handler registered for type='{type}' providerId='{providerId}'.");
    }
}
