using Microsoft.Extensions.Logging;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 7] Composes the LLM prompt from all enriched context data
/// and calls Ollama to generate a response.
/// Applies typing simulation delay before inference.
/// Stores the generated response text in the context.
/// </summary>
public sealed class LlmStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<LlmStep> _logger;

    public LlmStep(ILogger<LlmStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        _logger.LogDebug("[Step 7] LlmStep executing for @{User}", context.Message.Sender.UserName);

        // TODO: apply DecisionResult.TypingDelay
        // TODO: compose prompt from Persona + GameActivity + RagEnrichment + EmotionState
        // TODO: call Ollama HTTP API
        // TODO: context.Set(new LlmResponse(...))

        return Task.FromResult(context);
    }
}
