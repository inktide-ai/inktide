namespace Inktide.API.Graph.Domain.Contracts;

/// <summary>
/// Executes a node at runtime.
/// One implementation per (Type, ProviderId) pair, complementing <see cref="INodeProvider"/>.
/// </summary>
public interface INodeHandler
{
    string Type { get; }

    string ProviderId { get; }

    Task ExecuteAsync(Models.NodeExecutionContext context, CancellationToken ct);
}
