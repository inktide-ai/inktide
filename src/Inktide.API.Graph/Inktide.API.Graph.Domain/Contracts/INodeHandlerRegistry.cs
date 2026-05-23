namespace Inktide.API.Graph.Domain.Contracts;

/// <summary>
/// Resolves <see cref="INodeHandler"/> instances by (type, providerId).
/// </summary>
public interface INodeHandlerRegistry
{
    INodeHandler Get(string type, string providerId);
}
