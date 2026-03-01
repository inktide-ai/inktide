using Chimera.AI.Orchestrator.Infrastructure.Models;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>
/// Processes a chat message consumed from RabbitMQ.
/// Implement this to plug in your own logic (AI inference, storage, forwarding, etc.).
/// </summary>
public interface IChatMessageHandler
{
    Task HandleAsync(ChatMessage message, CancellationToken ct = default);
}
