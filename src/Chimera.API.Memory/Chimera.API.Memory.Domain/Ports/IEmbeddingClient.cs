namespace Chimera.API.Memory.Domain.Ports;

/// <summary>
/// Outbound port — generates dense vector embeddings via the Scribe Python worker.
/// </summary>
public interface IEmbeddingClient
{
    Task<float[]> EmbedAsync(string text, CancellationToken ct = default);

    Task<IReadOnlyList<float[]>> EmbedBatchAsync(IReadOnlyList<string> texts, CancellationToken ct = default);
}
