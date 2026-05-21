namespace Inktide.API.Synapse.Application.Interfaces;

public interface IGraphPluginEnrichmentPort
{
    IAsyncEnumerable<IReadOnlyDictionary<string, object>> EnrichAsync(
        Guid projectId,
        IReadOnlyDictionary<string, object> input,
        CancellationToken ct = default);
}
