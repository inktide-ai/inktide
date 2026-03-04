using Microsoft.Extensions.Logging;
using Chimera.AI.Orchestrator.Application.Interfaces;
using Chimera.AI.Orchestrator.Application.Models;

namespace Chimera.AI.Orchestrator.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 3] Fetches current game activity from Chimera.ActivityMonitor via gRPC.
/// The monitor continuously analyses stream frames (YOLO, scene classifier).
/// Enriches context with GameActivity: game name, scene type, detected objects.
/// </summary>
public sealed class ActivityStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<ActivityStep> _logger;

    public ActivityStep(ILogger<ActivityStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {

        _logger.LogDebug("[Step 3] ActivityStep executing for {Text}", context.Message.Text);

        // TODO: call IActivityMonitorClient.GetCurrentActivityAsync()
        // TODO: context.Set(new GameActivity(...))

        return Task.FromResult(context);
    }
}
