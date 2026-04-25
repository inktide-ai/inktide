using Inktide.API.Connector.Application.Models;

namespace Inktide.API.Connector.Infrastructure.Messaging;

/// <summary>In-memory queue between chat connectors (producers) and the Redis stream ingest publisher (consumer).</summary>
public interface IChatMessageQueue
{
    /// <summary>Enqueues a message. Returns false if the buffer is full and the message was dropped.</summary>
    bool TryEnqueue(ChatMessage message);

    /// <summary>Asynchronously streams all messages until <paramref name="ct"/> is cancelled.</summary>
    IAsyncEnumerable<ChatMessage> ConsumeAllAsync(CancellationToken ct);
}
