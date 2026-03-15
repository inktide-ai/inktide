using Microsoft.Extensions.Logging;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 4] Enriches the context with relevant memories from Chimera.RAG via gRPC.
/// RAG service performs vector search (Qdrant) and graph traversal (Neo4j)
/// to retrieve past conversation fragments and relationship context.
/// </summary>
public sealed class RagStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<RagStep> _logger;

    public RagStep(ILogger<RagStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        _logger.LogDebug("[Step 4] RagStep executing for @{User}", context.Message.Sender.UserName);

        // TODO: call IRagServiceClient.EnrichAsync()
        // TODO: context.Set(new RagEnrichment(...))

        return Task.FromResult(context);
    }
}
