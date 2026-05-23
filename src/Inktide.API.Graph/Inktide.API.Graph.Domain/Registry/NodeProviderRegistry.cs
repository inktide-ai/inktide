using Inktide.API.Graph.Domain.Contracts;

namespace Inktide.API.Graph.Domain.Registry;

/// <summary>
/// In-memory registry populated once at startup from DI-registered <see cref="INodeProvider"/> instances.
/// Thread-safe for concurrent reads after initialisation.
/// </summary>
public sealed class NodeProviderRegistry : INodeProviderRegistry
{
    private readonly IReadOnlyDictionary<(string Type, string ProviderId), INodeProvider> _index;
    private readonly IReadOnlyList<INodeProvider> _all;
    private readonly IReadOnlyDictionary<string, IReadOnlyList<INodeProvider>> _byType;

    public NodeProviderRegistry(IEnumerable<INodeProvider> providers)
    {
        _all = providers.ToList();
        _index = _all.ToDictionary(p => (p.Type, p.ProviderId));
        _byType = _all
            .GroupBy(p => p.Type)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<INodeProvider>)g.ToList());
    }

    public INodeProvider Get(string type, string providerId)
    {
        if (_index.TryGetValue((type, providerId), out var provider))
            return provider;

        throw new InvalidOperationException(
            $"No node provider registered for type='{type}' providerId='{providerId}'.");
    }

    public IReadOnlyList<INodeProvider> GetAll() => _all;

    public IReadOnlyList<INodeProvider> GetByType(string type) =>
        _byType.TryGetValue(type, out var list) ? list : [];
}
