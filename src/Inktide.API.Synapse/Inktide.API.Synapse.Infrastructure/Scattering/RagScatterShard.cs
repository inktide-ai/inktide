using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>Scatter shard: semantic memory retrieval via <see cref="IRagQueryPort"/>.</summary>
internal sealed class RagScatterShard : IPipelineStage
{

    private readonly IRagQueryPort _rag;
    private readonly ILogger<RagScatterShard> _logger;


    public string ShardId => SynapseConstants.ShardIds.Rag;

    public bool ShouldRun(AiCardContext? cardCtx)
        => SynapseConstants.PluginGate.IsEnabled(cardCtx?.Plugins, SynapseConstants.ShardIds.Rag);

    public RagScatterShard(IRagQueryPort rag, ILogger<RagScatterShard> logger)
    {
        _rag    = rag    ?? throw new ArgumentNullException(nameof(rag));
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

        IReadOnlyList<SynapseMemoryFact> memories;

        try
        {
            memories = await _rag.QueryAsync(
                cardCtx.CharacterId,
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
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[Scatter:{ShardId}] Unexpected error during RAG retrieval — skipping. Correlation={Correlation}",
                ShardId,
                context.CorrelationId);
            context.Set(new RagContext([]));
            return;
        }

        context.Set(new RagContext(memories));

        _logger.LogDebug(
            "[Scatter:{ShardId}] Retrieved {Count} memories for card {CardId}. Correlation={Correlation}",
            ShardId,
            memories.Count,
            cardCtx.CharacterId,
            context.CorrelationId);
    }

}
