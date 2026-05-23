using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: classifies the emotional reaction for the inbound message, then blends the result
/// into the character's running <see cref="EmotionalState"/> stored in Redis.
///
/// The aggregated envelope carries <see cref="EmotionalState"/> (trajectory, momentum, blended intensity)
/// rather than a raw per-message <see cref="EmotionResult"/>, so downstream components see emotional
/// continuity across conversation turns.
///
/// SRP: classification + state update only.
/// OCP: registered via <see cref="IPipelineStage"/> — removing this feature = delete file + DI.
/// </summary>
public sealed class EmotionScatterShard : IPipelineStage
{

    private readonly IEmotionClassificationService _classifier;
    private readonly IEmotionalStateService _emotionalState;
    private readonly ILogger<EmotionScatterShard> _logger;


    public string ShardId => SynapseConstants.ShardIds.Emotion;


    public EmotionScatterShard(
        IEmotionClassificationService classifier,
        IEmotionalStateService emotionalState,
        ILogger<EmotionScatterShard> logger)
    {
        _classifier     = classifier     ?? throw new ArgumentNullException(nameof(classifier));
        _emotionalState = emotionalState ?? throw new ArgumentNullException(nameof(emotionalState));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();

        if (cardCtx is null)
        {
            // No card context — store a neutral state so downstream code doesn't need null checks.
            context.Set(new EmotionalState(
                CharacterId:    Guid.Empty,
                CurrentEmotion: null,
                Intensity:      0f,
                PreviousEmotion: null,
                Momentum:       0f,
                TrajectoryLabel: null,
                LastUpdated:    DateTimeOffset.UtcNow));
            return;
        }

        EmotionalState updatedState;
        try
        {
            var classified = await _classifier.ClassifyAsync(
                context.Message.Text,
                cardCtx.Personality,
                cancellationToken,
                cardCtx.EmotionIntensityScale);

            var dynamics = cardCtx.EmotionDynamics ?? EmotionDynamics.Default;
            updatedState = await _emotionalState.UpdateAsync(
                cardCtx.CharacterId,
                classified,
                dynamics,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                "[Scatter:{ShardId}] Emotion service unavailable ({Reason}), using neutral state. Correlation={Correlation}",
                ShardId,
                ex.Message,
                context.CorrelationId);
            context.Set(new EmotionalState(
                CharacterId: cardCtx.CharacterId, CurrentEmotion: null,
                Intensity: 0f, PreviousEmotion: null, Momentum: 0f,
                TrajectoryLabel: null, LastUpdated: DateTimeOffset.UtcNow));
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[Scatter:{ShardId}] Unexpected error during emotion classification — using neutral state. Correlation={Correlation}",
                ShardId,
                context.CorrelationId);
            context.Set(new EmotionalState(
                CharacterId: cardCtx.CharacterId, CurrentEmotion: null,
                Intensity: 0f, PreviousEmotion: null, Momentum: 0f,
                TrajectoryLabel: null, LastUpdated: DateTimeOffset.UtcNow));
            return;
        }

        context.Set(updatedState);

        _logger.LogDebug(
            "[Scatter:{ShardId}] {Prev}→{Curr} intensity={Intensity:F2} momentum={Momentum:F2} trajectory={Trajectory} Correlation={Correlation}",
            ShardId,
            updatedState.PreviousEmotion ?? "null",
            updatedState.CurrentEmotion  ?? "null",
            updatedState.Intensity,
            updatedState.Momentum,
            updatedState.TrajectoryLabel ?? "-",
            context.CorrelationId);
    }

}
