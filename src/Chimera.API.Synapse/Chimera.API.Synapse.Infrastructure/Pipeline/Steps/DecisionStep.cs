using Microsoft.Extensions.Logging;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 6] Decides whether to respond and how.
/// Calculates response priority (donation = 100%, sub = 70%, regular = 10%),
/// typing simulation delay (proportional to message length)
/// and total response delay. Can abort the pipeline if response is not needed.
/// </summary>
public sealed class DecisionStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<DecisionStep> _logger;

    public DecisionStep(ILogger<DecisionStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        _logger.LogDebug("[Step 6] DecisionStep executing for @{User}", context.Message.Sender.UserName);
        
        // TODO: calculate priority from viewer badges / donation flags
        // TODO: calculate typing delay based on message.Text.Length
        // TODO: context.Set(new DecisionResult(...))
        // TODO: if should not respond → context.Abort("Decision: low priority")

        return Task.FromResult(context);
    }
}
