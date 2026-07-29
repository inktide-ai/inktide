using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: fetches recent screen awareness events for the current AI card.
/// Only runs when <see cref="AiCardContext.ScreenAwarenessEnabled"/> is true.
/// Falls back to an empty context on any error - never aborts the pipeline.
/// </summary>
internal sealed class ScreenContextScatterShard : IPipelineStage
{
    private readonly IScreenContextRepository _repo;
    private readonly ILogger<ScreenContextScatterShard> _logger;

    public string ShardId => SynapseConstants.ShardIds.Screen;

    public bool ShouldRun(AiCardContext? cardCtx)
        => SynapseConstants.PluginGate.IsEnabled(cardCtx?.Plugins, SynapseConstants.ShardIds.Screen);

    public ScreenContextScatterShard(
        IScreenContextRepository repo,
        ILogger<ScreenContextScatterShard> logger)
    {
        _repo   = repo   ?? throw new ArgumentNullException(nameof(repo));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();
        if (cardCtx is null || !cardCtx.ScreenAwarenessEnabled)
        {
            context.Set(new ScreenContext([], DateTimeOffset.UtcNow));
            return;
        }

        ScreenContext screenCtx;
        try
        {
            screenCtx = await _repo.GetRecentAsync(cardCtx.CharacterId, SynapseConstants.Prompts.ScreenContextWindow, cancellationToken)
                        ?? new ScreenContext([], DateTimeOffset.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "[Scatter:{ShardId}] Screen context fetch failed — continuing without screen context. " +
                "CharacterId={CharacterId} Correlation={Correlation}",
                ShardId, cardCtx.CharacterId, context.CorrelationId);
            screenCtx = new ScreenContext([], DateTimeOffset.UtcNow);
        }

        context.Set(screenCtx);

        _logger.LogDebug(
            "[Scatter:{ShardId}] Loaded {Count} screen events for character {CharacterId}. Correlation={Correlation}",
            ShardId, screenCtx.RecentEvents.Count, cardCtx.CharacterId, context.CorrelationId);
    }
}
