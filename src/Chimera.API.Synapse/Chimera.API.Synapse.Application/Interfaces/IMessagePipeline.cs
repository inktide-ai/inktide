using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Application.Interfaces;

/// <summary>
/// Immutable pipeline runner. Injected into the consumer worker.
/// </summary>
public interface IMessagePipeline
{
    Task RunAsync(MessageProcessingContext context, CancellationToken ct = default);
}
