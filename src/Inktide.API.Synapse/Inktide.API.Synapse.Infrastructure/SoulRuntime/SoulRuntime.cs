using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.SoulRuntime;

/// <summary>
/// Loads the soul's saved graph and executes its plugin (enrichment) nodes in topological order,
/// populating <see cref="MessageProcessingContext"/> with RAG context, emotion, and filter results.
///
/// Only nodes with <c>Type == "plugin"</c> are executed here. Core nodes (input, llm, tts, output)
/// remain in their own workers. LLM and TTS stay on the Redis-stream path.
/// </summary>
public sealed class SoulRuntime : ISoulRuntime
{
    private readonly IGraphPluginEnrichmentPort _graphPort;
    private readonly ILogger<SoulRuntime> _logger;

    public SoulRuntime(
        IGraphPluginEnrichmentPort graphPort,
        ILogger<SoulRuntime> logger)
    {
        _graphPort = graphPort ?? throw new ArgumentNullException(nameof(graphPort));
        _logger    = logger   ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task EnrichAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        var cardCtx = context.Get<AiCardContext>();
        if (cardCtx is null)
        {
            _logger.LogDebug("SoulRuntime: no AiCardContext in pipeline context, skipping enrichment");
            return;
        }

        if (cardCtx.ProjectId is null)
        {
            _logger.LogDebug("SoulRuntime: soul {SoulId} has no linked project, skipping graph enrichment", cardCtx.CharacterId);
            return;
        }

        var initialInput = BuildInitialInput(context, cardCtx);

        _logger.LogDebug(
            "SoulRuntime: executing plugin nodes for project {ProjectId}. Correlation={Correlation}",
            cardCtx.ProjectId, context.CorrelationId);

        await foreach (var outputs in _graphPort.EnrichAsync(cardCtx.ProjectId.Value, initialInput, ct))
        {
            ApplyOutputs(context, outputs);
        }

        context.MarkSoulRuntimeExecuted();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static Dictionary<string, object> BuildInitialInput(
        MessageProcessingContext ctx,
        AiCardContext cardCtx) =>
        new()
        {
            ["context"]        = ctx.Message.Text ?? string.Empty,
            ["text"]           = ctx.Message.Text ?? string.Empty,
            ["card_id"]        = cardCtx.CharacterId.ToString(),
            ["personality"]    = cardCtx.Personality,
            ["memory_enabled"] = cardCtx.MemoryEnabled,
            ["max_memories"]   = cardCtx.MaxMemories,
            ["sender"]         = ctx.Message.Sender.UserName ?? string.Empty,
            ["channel_id"]     = ctx.Message.ChannelId ?? string.Empty,
            ["channel_name"]   = ctx.Message.ChannelName ?? string.Empty,
        };

    private static void ApplyOutputs(
        MessageProcessingContext ctx,
        IReadOnlyDictionary<string, object> outputs)
    {
        if (outputs.TryGetValue("memories", out var mems) && mems is IReadOnlyList<SynapseMemoryFact> facts
            && ctx.Get<RagContext>() is null)
        {
            ctx.Set(new RagContext(facts));
        }

        if (outputs.TryGetValue("emotion", out var em) && em is string emotion
            && !string.IsNullOrWhiteSpace(emotion)
            && ctx.Get<EmotionResult>() is null)
        {
            ctx.Set(new EmotionResult(emotion, 0.8f));
        }
    }
}
