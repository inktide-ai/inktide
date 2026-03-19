using Chimera.API.Connector.Application.Models;

namespace Chimera.API.Connector.Application.Contracts;

/// <summary>Handles incoming chat messages from any platform (publish to RabbitMQ, log, etc.).</summary>
public interface IStreamMessageHandler
{
    Task HandleAsync(ChatMessage message, CancellationToken cancellationToken = default);
}
