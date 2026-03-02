using Chimera.AI.Orchestrator.Application.Models;

namespace Chimera.AI.Orchestrator.Application.Interfaces;

/// <summary>
/// Immutable pipeline runner. Injected into the consumer worker.
/// </summary>
public interface IMessagePipeline
{
    Task RunAsync(MessageProcessingContext context, CancellationToken ct = default);
}
