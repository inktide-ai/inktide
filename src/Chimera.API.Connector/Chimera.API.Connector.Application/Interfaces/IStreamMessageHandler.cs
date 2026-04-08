using Chimera.API.Connector.Application.Models;

namespace Chimera.API.Connector.Application.Interfaces;

/// <summary>Handles incoming chat messages from any platform (enqueue to Synapse ingest, log, etc.).</summary>
public interface IStreamMessageHandler
{
    Task HandleAsync(ChatMessage message, CancellationToken cancellationToken = default);
}
