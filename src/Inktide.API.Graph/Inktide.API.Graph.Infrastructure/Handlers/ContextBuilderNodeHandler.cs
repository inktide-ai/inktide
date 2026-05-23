using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Inktide.API.Memory.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Aggregates the normalised message context (from Input) with optional plugin enrichments
/// (memories from Memory node, emotion label from Emotion node) into a single prompt-ready
/// context envelope for the LLM.
///
/// This is the central hub of the enrichment pipeline:
///   Discord/Twitch → Input
///                           → Context (this node) → LLM → TTS → Output
///   Memory        ──────────────↗
///   Emotion       ──────────────↗
///
/// Input ports:
///   "context"  (required) — normalised message context from Input node
///   "memories" (optional) — IReadOnlyList&lt;MemoryRecord&gt; from Memory node
///   "emotion"  (optional) — emotion label string from Emotion node
///
/// Output ports:
///   "out"     — enriched context string for LLM
///   "emotion" — pass-through emotion label (for SoulRuntime to store in MessageProcessingContext)
/// </summary>
public sealed class ContextBuilderNodeHandler : INodeHandler
{
    public string Type => "context_builder";
    public string ProviderId => "core";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetService<ILogger<ContextBuilderNodeHandler>>();

        var baseContext = context.GetInput<string>("context") ?? string.Empty;

        // Append memories block if Memory node is connected and returned results.
        var memories = context.GetInput<IReadOnlyList<MemoryRecord>>("memories");
        if (memories is { Count: > 0 })
        {
            var block = string.Join("\n", memories.Select(m => $"- {m.FactText}"));
            baseContext = $"{baseContext}\n\nRelevant context from memory:\n{block}";
            logger?.LogDebug("ContextBuilder: appended {Count} memory entries", memories.Count);
        }

        // Emotion label — pass through for SoulRuntime to store in MessageProcessingContext.
        var emotion = context.GetInput<string>("emotion");
        if (!string.IsNullOrWhiteSpace(emotion))
            logger?.LogDebug("ContextBuilder: emotion signal = '{Emotion}'", emotion);

        context.SetOutput("out", baseContext);

        if (!string.IsNullOrWhiteSpace(emotion))
            context.SetOutput("emotion", emotion);

        return Task.CompletedTask;
    }
}
