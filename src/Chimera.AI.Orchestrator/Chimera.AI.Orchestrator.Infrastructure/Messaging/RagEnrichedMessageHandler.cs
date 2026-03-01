using Microsoft.Extensions.Logging;
using Chimera.AI.Orchestrator.Application.Contracts;
using Chimera.AI.Orchestrator.Application.Models;
using Chimera.AI.Orchestrator.Infrastructure.Models;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>
/// Processes each incoming chat message through the RAG pipeline:
/// 1. Embed the message text
/// 2. Search for similar past memories
/// 3. Store the current message as a new memory
/// </summary>
public sealed class RagEnrichedMessageHandler : IChatMessageHandler
{
    private readonly IEmbeddingProvider _embeddingProvider;
    private readonly IMemoryService _memoryService;
    private readonly ILogger<RagEnrichedMessageHandler> _logger;

    public RagEnrichedMessageHandler(
        IEmbeddingProvider embeddingProvider,
        IMemoryService memoryService,
        ILogger<RagEnrichedMessageHandler> logger)
    {
        _embeddingProvider = embeddingProvider;
        _memoryService = memoryService;
        _logger = logger;
    }

    public async Task HandleAsync(ChatMessage message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(message.Text))
            return;

        float[] vector;
        try
        {
            vector = await _embeddingProvider.EmbedAsync(message.Text, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to embed message from {User}", message.Sender.UserName);
            return;
        }

        IReadOnlyList<MemoryFragment> memories;
        try
        {
            memories = await _memoryService.SearchAsync(
                queryVector: vector,
                viewerId: message.Sender.UserId,
                platform: message.PlatformId,
                channelId: message.ChannelId,
                limit: 5,
                scoreThreshold: 0.5f,
                ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Memory search failed for {User}", message.Sender.UserName);
            memories = [];
        }

        if (memories.Count > 0)
        {
            _logger.LogInformation(
                "[RAG] Found {Count} relevant memories for @{User} (best score: {Score:F3})",
                memories.Count, message.Sender.UserName, memories[0].Score);

            foreach (var mem in memories)
            {
                _logger.LogDebug(
                    "  Memory [{Score:F3}] {Timestamp}: {Text}",
                    mem.Score, mem.Timestamp, Truncate(mem.Text, 100));
            }
        }
        else
        {
            _logger.LogDebug("[RAG] No relevant memories for @{User}", message.Sender.UserName);
        }

        var entry = new MemoryEntry(
            Text: message.Text,
            Vector: vector,
            Type: MemoryType.Message,
            ViewerId: message.Sender.UserId,
            ViewerName: message.Sender.UserName,
            Platform: message.PlatformId,
            ChannelId: message.ChannelId,
            ChannelName: message.ChannelName,
            Timestamp: message.Timestamp);

        try
        {
            await _memoryService.StoreAsync(entry, ct);
            _logger.LogDebug("[RAG] Stored memory for @{User}: {Text}",
                message.Sender.UserName, Truncate(message.Text, 80));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store memory for {User}", message.Sender.UserName);
        }
    }

    private static string Truncate(string s, int maxLen) =>
        s.Length <= maxLen ? s : string.Concat(s.AsSpan(0, maxLen), "...");
}
