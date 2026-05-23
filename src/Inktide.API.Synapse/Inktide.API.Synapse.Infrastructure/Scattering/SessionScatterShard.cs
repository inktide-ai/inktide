using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: loads recent conversation history from Redis for the current channel.
/// Runs in parallel with RAG and Context shards.
/// Falls back to an empty history on any error — never aborts the pipeline.
/// </summary>
public sealed class SessionScatterShard : IPipelineStage
{
    private const int DefaultMaxTurns = 20;

    private readonly IConversationHistoryRepository _history;
    private readonly ILogger<SessionScatterShard> _logger;

    public string ShardId => SynapseConstants.ShardIds.Session;

    public SessionScatterShard(
        IConversationHistoryRepository history,
        ILogger<SessionScatterShard> logger)
    {
        _history = history ?? throw new ArgumentNullException(nameof(history));
        _logger  = logger  ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();
        if (cardCtx is null)
        {
            context.Set(new SessionContext([]));
            return;
        }

        IReadOnlyList<ConversationTurn> turns;
        try
        {
            turns = await _history.GetAsync(
                context.Message.ChannelId,
                DefaultMaxTurns,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "[Scatter:{ShardId}] History fetch failed — continuing without history. " +
                "Channel={ChannelId} Correlation={Correlation}",
                ShardId, context.Message.ChannelId, context.CorrelationId);
            turns = [];
        }

        context.Set(new SessionContext(turns));

        _logger.LogDebug(
            "[Scatter:{ShardId}] Loaded {Count} history turns for channel {ChannelId}. Correlation={Correlation}",
            ShardId, turns.Count, context.Message.ChannelId, context.CorrelationId);
    }
}
