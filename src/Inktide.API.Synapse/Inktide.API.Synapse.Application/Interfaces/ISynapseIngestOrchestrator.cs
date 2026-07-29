using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Event-driven aggregation entry point: one Redis stream message -> resolve channel context ->
/// parallel scatter (Session, RAG, Context) -> aggregate (JSON + log).
/// </summary>
public interface ISynapseIngestOrchestrator
{
    Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default);
}
