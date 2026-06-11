using Inktide.API.Synapse.Application.Interfaces;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

internal sealed class GraphPluginEnrichmentAdapter : IGraphPluginEnrichmentPort
{
    public async IAsyncEnumerable<IReadOnlyDictionary<string, object>> EnrichAsync(
        Guid projectId,
        IReadOnlyDictionary<string, object> input,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
    {
        await Task.CompletedTask;
        yield break;
    }
}
