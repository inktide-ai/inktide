namespace Chimera.AI.Orchestrator.Application.Contracts;

/// <summary>
/// Generates dense vector embeddings from text.
/// Implementations may call a local model (Ollama) or an external API.
/// </summary>
public interface IEmbeddingProvider
{
    /// <summary>
    /// Embed a single text string into a float vector.
    /// </summary>
    Task<float[]> EmbedAsync(string text, CancellationToken ct = default);

    /// <summary>
    /// Embed multiple texts in a single batch call (more efficient when supported).
    /// </summary>
    Task<IReadOnlyList<float[]>> EmbedBatchAsync(IReadOnlyList<string> texts, CancellationToken ct = default);
}
