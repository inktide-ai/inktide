using Chimera.ApiGateway.Application.Models.Streaming;

namespace Chimera.ApiGateway.Infrastructure.Messaging;

/// <summary>In-memory queue between chat connectors (producers) and the RabbitMQ publisher (consumer).</summary>
public interface IChatMessageQueue
{
    /// <summary>Enqueues a message. Returns false if the buffer is full and the message was dropped.</summary>
    bool TryEnqueue(ChatMessage message);

    /// <summary>Asynchronously streams all messages until <paramref name="ct"/> is cancelled.</summary>
    IAsyncEnumerable<ChatMessage> ConsumeAllAsync(CancellationToken ct);
}
