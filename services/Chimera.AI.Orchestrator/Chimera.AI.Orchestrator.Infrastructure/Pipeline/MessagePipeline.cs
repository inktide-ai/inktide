using Chimera.AI.Orchestrator.Application.Interfaces;
using Chimera.AI.Orchestrator.Application.Models;
using Chimera.AI.Orchestrator.Application.Pipeline;

namespace Chimera.AI.Orchestrator.Infrastructure.Pipeline;

/// <summary>
/// Adapts <see cref="Pipeline{T}"/> to <see cref="IMessagePipeline"/>.
/// Allows the worker to depend on the domain interface
/// without knowing about the generic Pipeline implementation.
/// </summary>
internal sealed class MessagePipeline : IMessagePipeline
{
    private readonly Pipeline<MessageProcessingContext> _pipeline;

    internal MessagePipeline(Pipeline<MessageProcessingContext> pipeline)
    {
        _pipeline = pipeline;
    }

    public Task RunAsync(MessageProcessingContext context, CancellationToken ct = default)
        => _pipeline.ExecuteAsync(context, ct);
    
}
