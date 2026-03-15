using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Chimera.API.Synapse.Application.Pipeline;

namespace Chimera.API.Synapse.Infrastructure.Pipeline;

/// <summary>
/// Adapts <see cref="PipelineType{T}"/> to <see cref="IMessagePipeline"/>.
/// Allows the worker to depend on the domain interface
/// without knowing about the generic Pipeline implementation.
/// </summary>
internal sealed class MessagePipeline : IMessagePipeline
{
    private readonly PipelineType<MessageProcessingContext> _pipelineType;

    internal MessagePipeline(PipelineType<MessageProcessingContext> pipelineType)
    {
        _pipelineType = pipelineType;
    }

    public Task RunAsync(MessageProcessingContext context, CancellationToken ct = default)
        => _pipelineType.ExecuteAsync(context, ct);
    
}
