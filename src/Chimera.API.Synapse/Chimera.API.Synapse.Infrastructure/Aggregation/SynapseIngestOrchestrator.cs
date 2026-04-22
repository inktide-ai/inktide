using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Synapse.Infrastructure.Aggregation;

/// <summary>
/// Redis Streams delivers each message once to this host’s consumer; we fan-out to Session, RAG, and Context shards
/// in-process (scatter-gather). Multiple Redis consumers in the same group would partition messages — not duplicate
/// them — so parallel domain work for the same event stays here.
/// </summary>
public sealed class SynapseIngestOrchestrator : ISynapseIngestOrchestrator
{

    private readonly IChannelContextResolutionService _channelContext;
    private readonly IEnumerable<ISynapseScatterShard> _shards;
    private readonly ISynapseAggregationService _aggregation;
    private readonly ILogger<SynapseIngestOrchestrator> _logger;


    public SynapseIngestOrchestrator(
        IChannelContextResolutionService channelContext,
        IEnumerable<ISynapseScatterShard> shards,
        ISynapseAggregationService aggregation,
        ILogger<SynapseIngestOrchestrator> logger)
    {
        _channelContext = channelContext ?? throw new ArgumentNullException(nameof(channelContext));
        _shards = shards ?? throw new ArgumentNullException(nameof(shards));
        _aggregation = aggregation ?? throw new ArgumentNullException(nameof(aggregation));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        await _channelContext.ResolveAsync(context, cancellationToken);
        if (context.IsAborted)
        {
            return;
        }

        var orderedShards = _shards.OrderBy(s => s.ShardId, StringComparer.Ordinal).ToArray();
        var scatterTasks = orderedShards.Select(
            s => RunShardSafeAsync(s, context, cancellationToken)).ToArray();

        await Task.WhenAll(scatterTasks);

        await _aggregation.AggregateAsync(context, cancellationToken);
    }


    private async Task RunShardSafeAsync(
        ISynapseScatterShard shard,
        MessageProcessingContext context,
        CancellationToken cancellationToken)
    {
        try
        {
            await shard.ProcessAsync(context, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Scatter shard failed, continuing with partial data. ShardId={ShardId} Correlation={Correlation}",
                shard.ShardId,
                context.CorrelationId);
        }
    }

}
