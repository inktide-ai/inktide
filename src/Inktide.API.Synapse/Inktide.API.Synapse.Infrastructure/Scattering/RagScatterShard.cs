using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>Scatter shard: semantic memory retrieval via <see cref="IMemoryQueryService"/>.</summary>
public sealed class RagScatterShard : ISynapseScatterShard
{

    private readonly IMemoryQueryService _memory;
    private readonly ILogger<RagScatterShard> _logger;


    public string ShardId => "rag";


    public RagScatterShard(IMemoryQueryService memory, ILogger<RagScatterShard> logger)
    {
        _memory = memory ?? throw new ArgumentNullException(nameof(memory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();

        if (cardCtx is null || !cardCtx.MemoryEnabled)
        {
            context.Set(new RagContext([]));
            return;
        }

        IReadOnlyList<MemoryRecord> memories;
        
        try
        {
            memories = await _memory.QueryAsync(
                cardCtx.AiCardId,
                context.Message.Text,
                cardCtx.MaxMemories,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                "[Scatter:{ShardId}] Embedding service unavailable ({Reason}), RAG skipped. Correlation={Correlation}",
                ShardId,
                ex.Message,
                context.CorrelationId);
            context.Set(new RagContext([]));
            return;
        }

        context.Set(new RagContext(memories));

        _logger.LogDebug(
            "[Scatter:{ShardId}] Retrieved {Count} memories for card {CardId}. Correlation={Correlation}",
            ShardId,
            memories.Count,
            cardCtx.AiCardId,
            context.CorrelationId);
    }

}
