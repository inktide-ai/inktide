using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Aggregation;

/// <summary>
/// Orchestrates one ingest event:
///   1. Resolve channel context (AiCard config, soul settings).
///   2. Enrich via SoulRuntime (graph-driven: memory, emotion, filter).
///      Falls back to legacy hardcoded scatter-gather shards if SoulRuntime is unavailable
///      or the soul has no saved graph.
///   3. Aggregate and publish to the LLM Redis stream.
/// </summary>
public sealed class SynapseIngestOrchestrator : ISynapseIngestOrchestrator
{
    private readonly IChannelContextResolutionService _channelContext;
    private readonly IEnumerable<IPipelineStage> _shards;
    private readonly ISynapseAggregationService _aggregation;
    private readonly ISoulRuntime _soulRuntime;
    private readonly ILogger<SynapseIngestOrchestrator> _logger;

    public SynapseIngestOrchestrator(
        IChannelContextResolutionService channelContext,
        IEnumerable<IPipelineStage> shards,
        ISynapseAggregationService aggregation,
        ISoulRuntime soulRuntime,
        ILogger<SynapseIngestOrchestrator> logger)
    {
        _channelContext = channelContext ?? throw new ArgumentNullException(nameof(channelContext));
        _shards         = shards         ?? throw new ArgumentNullException(nameof(shards));
        _aggregation    = aggregation    ?? throw new ArgumentNullException(nameof(aggregation));
        _soulRuntime    = soulRuntime    ?? throw new ArgumentNullException(nameof(soulRuntime));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(
        MessageProcessingContext context,
        CancellationToken cancellationToken = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        // ── Step 1: resolve AiCard config ────────────────────────────────────
        await _channelContext.ResolveAsync(context, cancellationToken);
        if (context.IsAborted)
        {
            _logger.LogDebug(
                "Pipeline aborted after channel context resolution. Correlation={Correlation}",
                context.CorrelationId);
            return;
        }

        var cardCtx = context.Get<Application.Models.AiCardContext>();
        var soulId  = cardCtx?.CharacterId.ToString() ?? "unknown";

        // ── Step 2: enrich via graph-driven SoulRuntime ──────────────────────
        // SoulRuntime runs plugin nodes from the soul's saved graph.
        // If no graph exists, it returns silently — we fall back to shards below.
        var graphEnriched = false;
        try
        {
            await _soulRuntime.EnrichAsync(context, cancellationToken);

            // Detect if SoulRuntime actually produced any enrichment.
            graphEnriched = context.Get<Application.Models.RagContext>() is not null
                         || context.Get<Application.Models.EmotionResult>() is not null;

            if (graphEnriched)
            {
                _logger.LogInformation(
                    "Pipeline path=SoulRuntime enriched context. SoulId={SoulId} Correlation={Correlation} ElapsedMs={ElapsedMs}",
                    soulId, context.CorrelationId, sw.ElapsedMilliseconds);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Pipeline path=SoulRuntime FAILED, falling back to scatter shards. SoulId={SoulId} Correlation={Correlation}",
                soulId, context.CorrelationId);
        }

        // ── Step 2b: legacy fallback ─────────────────────────────────────────
        // Run hardcoded shards only if SoulRuntime didn't enrich the context.
        // This preserves backwards-compatibility for souls without a saved graph.
        if (!graphEnriched)
        {
            // Respect per-project plugin config. Missing entry = default ON (backwards compatible).
            var plugins = cardCtx?.Plugins;
            bool IsPluginEnabled(string id) =>
                plugins?.FirstOrDefault(p => p.PluginId == id)?.IsEnabled ?? false;

            var orderedShards = _shards
                .OrderBy(s => s.ShardId, StringComparer.Ordinal)
                .Where(s => s.ShardId != SynapseConstants.ShardIds.Rag || IsPluginEnabled(SynapseConstants.ShardIds.Rag))
                .ToArray();

            var shardIds = string.Join(',', orderedShards.Select(s => s.ShardId));

            _logger.LogInformation(
                "Pipeline path=ScatterShards. SoulId={SoulId} Shards=[{ShardIds}] Correlation={Correlation}",
                soulId, shardIds, context.CorrelationId);

            var scatterTasks = orderedShards.Select(s => RunShardSafeAsync(s, context, cancellationToken)).ToArray();
            await Task.WhenAll(scatterTasks);
        }

        // ── Step 3: aggregate and publish to LLM stream ──────────────────────
        await _aggregation.AggregateAsync(context, cancellationToken);

        _logger.LogDebug(
            "Pipeline complete. SoulId={SoulId} Path={Path} Correlation={Correlation} TotalMs={TotalMs}",
            soulId,
            graphEnriched ? "SoulRuntime" : "ScatterShards",
            context.CorrelationId,
            sw.ElapsedMilliseconds);
    }

    private static readonly TimeSpan ShardTimeout = TimeSpan.FromMilliseconds(2500);

    private async Task RunShardSafeAsync(
        IPipelineStage shard,
        MessageProcessingContext context,
        CancellationToken cancellationToken)
    {
        using var shardCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        shardCts.CancelAfter(ShardTimeout);
        try
        {
            await shard.ProcessAsync(context, shardCts.Token)
                .WaitAsync(ShardTimeout, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            context.MarkDegraded(shard.ShardId);
            _logger.LogWarning(
                "Scatter shard timed out after {TimeoutMs}ms. ShardId={ShardId} Correlation={Correlation}",
                ShardTimeout.TotalMilliseconds, shard.ShardId, context.CorrelationId);
        }
        catch (Exception ex)
        {
            context.MarkDegraded(shard.ShardId);
            _logger.LogError(
                ex,
                "Scatter shard failed, continuing with partial data. ShardId={ShardId} Correlation={Correlation}",
                shard.ShardId, context.CorrelationId);
        }
    }
}
