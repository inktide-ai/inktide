using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Contracts;

/// <summary>
/// Executes a <see cref="GraphDefinition"/> node-by-node in topological order.
/// </summary>
public interface IGraphExecutor
{
    IAsyncEnumerable<GraphExecutionEvent> ExecuteAsync(
        GraphDefinition graph,
        IReadOnlyDictionary<string, object> initialInput,
        IServiceProvider services,
        CancellationToken ct = default);
}
