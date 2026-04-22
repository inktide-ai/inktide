using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: classifies the emotional reaction for the inbound message.
/// Runs in parallel with RAG and Session shards — adds zero latency to the pipeline
/// because the aggregation waits for all shards via <c>Task.WhenAll</c>.
///
/// SRP: only performs emotion classification and stores the result.
/// OCP: registered via <see cref="ISynapseScatterShard"/> — orchestrator is unaware of this type.
/// Removing this feature = delete this file + remove the DI registration.
/// </summary>
public sealed class EmotionScatterShard : ISynapseScatterShard
{

    private readonly IEmotionClassificationService _classifier;
    private readonly ILogger<EmotionScatterShard> _logger;


    public string ShardId => "emotion";


    public EmotionScatterShard(
        IEmotionClassificationService classifier,
        ILogger<EmotionScatterShard> logger)
    {
        _classifier = classifier ?? throw new ArgumentNullException(nameof(classifier));
        _logger     = logger     ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();

        if (cardCtx is null)
        {
            context.Set(new EmotionResult(null, 0f));
            return;
        }

        var result = await _classifier.ClassifyAsync(
            context.Message.Text,
            cardCtx.Personality,
            cancellationToken,
            cardCtx.EmotionIntensityScale);

        context.Set(result);

        _logger.LogDebug(
            "[Scatter:{ShardId}] emotion={Emotion} intensity={Intensity:F2} Correlation={Correlation}",
            ShardId,
            result.Emotion ?? "null",
            result.Intensity,
            context.CorrelationId);
    }

}
