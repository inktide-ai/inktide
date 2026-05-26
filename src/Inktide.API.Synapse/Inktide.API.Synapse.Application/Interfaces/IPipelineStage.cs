using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// One stage of the scatter phase (Session, RAG, Emotion, etc.).
/// All stages receive the same <see cref="MessageProcessingContext"/> after channel context resolution.
/// Register additional stages via DI — the orchestrator discovers them automatically.
/// </summary>
public interface IPipelineStage
{
    /// <summary>Stable id for logs and diagnostics (e.g. <c>session</c>, <c>rag</c>, <c>emotion</c>).</summary>
    string ShardId { get; }

    /// <summary>
    /// Returns false if this shard should be skipped for the given card context.
    /// Default: always run. Override in shards that have a plugin switch.
    /// </summary>
    bool ShouldRun(AiCardContext? cardCtx) => true;

    Task ProcessAsync(
        MessageProcessingContext context,
        CancellationToken cancellationToken = default);
}
