using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Application.Interfaces;

/// <summary>
/// One leg of the scatter phase (Session, RAG, or Context). All shards receive the same
/// <see cref="MessageProcessingContext"/> after channel context (AiCard) resolution.
/// </summary>
public interface ISynapseScatterShard
{
    /// <summary>Stable id for logs and diagnostics (e.g. <c>session</c>, <c>rag</c>, <c>context</c>).</summary>
    string ShardId { get; }

    Task ProcessAsync(
        MessageProcessingContext context,
        CancellationToken cancellationToken = default);
    
}
