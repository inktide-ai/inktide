using Chimera.ApiGateway.Application.Models.Streaming;

namespace Chimera.ApiGateway.Application.Contracts.Streaming;

/// <summary>Handles incoming chat messages from any platform (publish to RabbitMQ, log, etc.).</summary>
public interface IStreamMessageHandler
{
    Task HandleAsync(ChatMessage message, CancellationToken cancellationToken = default);
}
