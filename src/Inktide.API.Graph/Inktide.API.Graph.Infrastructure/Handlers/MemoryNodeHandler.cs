using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Plugin node: retrieves semantically relevant memories from the Qdrant vector store
/// and appends them to the context envelope passed downstream.
///
/// Expected inputs (via initialInput or upstream node):
///   "context"        — raw message text to embed and enrich
///   "card_id"        — soul GUID as string (used to scope the vector collection)
///   "memory_enabled" — bool, skip RAG if false
///   "max_memories"   — int, top-K limit (default 5)
///
/// Outputs:
///   "context"  — original text + appended memory block
///   "memories" — IReadOnlyList&lt;MemoryRecord&gt; for downstream handlers and SoulRuntime mapping
/// </summary>
public sealed class MemoryNodeHandler : INodeHandler
{
    public string Type => "plugin";
    public string ProviderId => "memory";

    public async Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetService<ILogger<MemoryNodeHandler>>();

        var text          = context.GetInput<string>("context") ?? string.Empty;
        var memoryEnabled = context.GetInput<bool?>("memory_enabled") ?? true;
        var topK          = context.GetConfig<int?>("top_k") ?? context.GetInput<int?>("max_memories") ?? 5;
        var cardIdStr     = context.GetInput<string>("card_id") ?? string.Empty;

        // Always emit the context downstream even if enrichment is skipped.
        context.SetOutput("context", text);
        context.SetOutput("memories", Array.Empty<Memory.Domain.Models.MemoryRecord>());

        if (!memoryEnabled)
        {
            logger?.LogDebug("MemoryNode: memory disabled for this soul, passing context through");
            return;
        }

        if (!Guid.TryParse(cardIdStr, out var cardId))
        {
            logger?.LogWarning("MemoryNode: card_id '{CardId}' is not a valid GUID, skipping RAG", cardIdStr);
            return;
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            logger?.LogDebug("MemoryNode: empty query text, skipping RAG");
            return;
        }

        var memoryService = context.Services.GetService<IMemoryQueryService>();
        if (memoryService is null)
        {
            logger?.LogWarning("MemoryNode: IMemoryQueryService not registered — RAG unavailable");
            return;
        }

        IReadOnlyList<Memory.Domain.Models.MemoryRecord> memories;
        try
        {
            memories = await memoryService.QueryAsync(cardId, text, topK, ct);
        }
        catch (HttpRequestException ex)
        {
            logger?.LogWarning(ex, "MemoryNode: embedding service unavailable ({Reason}), RAG skipped", ex.Message);
            return;
        }

        if (memories.Count == 0)
        {
            logger?.LogDebug("MemoryNode: no relevant memories found");
            return;
        }

        var memBlock = string.Join("\n", memories.Select(m => $"- {m.FactText}"));
        var enriched = $"{text}\n\nRelevant context from memory:\n{memBlock}";

        context.SetOutput("context", enriched);
        context.SetOutput("memories", memories);

        logger?.LogDebug("MemoryNode: enriched context with {Count} memories", memories.Count);
    }
}
