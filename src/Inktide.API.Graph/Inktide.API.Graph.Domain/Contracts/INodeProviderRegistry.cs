namespace Inktide.API.Graph.Domain.Contracts;

/// <summary>
/// Central lookup for all registered <see cref="INodeProvider"/> implementations.
/// Populated at startup; plugins extend it by registering additional providers.
/// </summary>
public interface INodeProviderRegistry
{
    INodeProvider Get(string type, string providerId);

    IReadOnlyList<INodeProvider> GetAll();

    IReadOnlyList<INodeProvider> GetByType(string type);
}
