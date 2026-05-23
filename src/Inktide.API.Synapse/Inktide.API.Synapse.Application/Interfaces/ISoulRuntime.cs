using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Enriches a <see cref="MessageProcessingContext"/> by executing the plugin stages
/// defined in the soul's saved graph topology.
///
/// Replaces the hardcoded scatter-gather shards with a per-soul configurable pipeline.
/// Only "plugin" nodes (memory, emotion, filter) are executed here; LLM and TTS
/// continue via their existing Redis-stream workers.
/// </summary>
public interface ISoulRuntime
{
    /// <summary>
    /// Runs all enrichment nodes from the soul's graph in topological order,
    /// writing results (RAG context, emotion, etc.) into <paramref name="context"/>.
    /// Returns without throwing if no graph exists for the soul.
    /// </summary>
    Task EnrichAsync(MessageProcessingContext context, CancellationToken ct = default);
}
