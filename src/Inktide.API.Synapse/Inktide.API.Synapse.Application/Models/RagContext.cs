namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Semantically relevant memories retrieved from Qdrant.
/// Placed in <see cref="MessageProcessingContext"/> by the RAG scatter shard (parallel stage).
/// </summary>
public sealed record RagContext(IReadOnlyList<SynapseMemoryFact> Memories);
