using Microsoft.Extensions.Logging;
using Chimera.AI.Orchestrator.Application.Interfaces;
using Chimera.AI.Orchestrator.Application.Models;

namespace Chimera.AI.Orchestrator.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 1] Analyses the incoming message using embedded ONNX models.
/// Detects sentiment, toxicity score, intent and named entities.
/// Results are stored as MessageAnalysis in the context.
/// </summary>
public sealed class MessageAnalysisStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<MessageAnalysisStep> _logger;

    public MessageAnalysisStep(ILogger<MessageAnalysisStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        _logger.LogDebug("[Step 1] MessageAnalysisStep executing for @{User}", context.Message.Sender.UserName);

        // TODO: run ONNX sentiment / toxicity / intent models

        return Task.FromResult(context);
    }
}
