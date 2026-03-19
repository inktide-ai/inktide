using Microsoft.Extensions.Logging;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Infrastructure.Pipeline.Steps;

/// <summary>
/// [Step 2] Loads streamer and viewer profiles from Redis cache → PostgreSQL.
/// Enriches context with PersonaSettings, StreamerProfile and ViewerProfile.
/// </summary>
public sealed class ContextStep : IPipelineStep<MessageProcessingContext>
{
    private readonly ILogger<ContextStep> _logger;

    public ContextStep(ILogger<ContextStep> logger)
    {
        _logger = logger;
    }

    public Task<MessageProcessingContext> ProcessAsync(MessageProcessingContext context, CancellationToken ct = default)
    {
        _logger.LogDebug("[Step 2] ContextStep executing for channel {Channel}", context.Message.ChannelId);

        // TODO: load PersonaSettings, StreamerProfile, ViewerProfile from Redis → PostgreSQL

        return Task.FromResult(context);
    }
}
