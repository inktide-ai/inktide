using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Inktide.API.Synapse.Infrastructure.Emotion;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: classifies the emotional reaction for the inbound message, then blends the result
/// into the character's running <see cref="EmotionalState"/> and <see cref="PhysicalState"/> in Redis.
///
/// Also notifies <see cref="IIdleActivityTracker"/> so IdleEventDispatcher can track per-character
/// idle thresholds driven by current arousal and energy.
///
/// SRP: classification + state update only.
/// OCP: registered via <see cref="IPipelineStage"/> — removing this feature = delete file + DI.
/// </summary>
internal sealed class EmotionScatterShard : IPipelineStage
{

    private readonly IEmotionClassificationService _classifier;
    private readonly IEmotionalStateService _emotionalState;
    private readonly IIdleActivityTracker _idleTracker;
    private readonly ILogger<EmotionScatterShard> _logger;


    public string ShardId => SynapseConstants.ShardIds.Emotion;

    public bool ShouldRun(AiCardContext? cardCtx)
        => SynapseConstants.PluginGate.IsEnabled(cardCtx?.Plugins, SynapseConstants.ShardIds.Emotion);

    public EmotionScatterShard(
        IEmotionClassificationService classifier,
        IEmotionalStateService emotionalState,
        IIdleActivityTracker idleTracker,
        ILogger<EmotionScatterShard> logger)
    {
        _classifier     = classifier     ?? throw new ArgumentNullException(nameof(classifier));
        _emotionalState = emotionalState ?? throw new ArgumentNullException(nameof(emotionalState));
        _idleTracker    = idleTracker    ?? throw new ArgumentNullException(nameof(idleTracker));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();

        if (cardCtx is null)
        {
            context.Set(new EmotionalState(
                CharacterId:    Guid.Empty,
                CurrentEmotion: null,
                Intensity:      0f,
                PreviousEmotion: null,
                Momentum:       0f,
                TrajectoryLabel: null,
                LastUpdated:    DateTimeOffset.UtcNow));
            context.Set(PhysicalState.Default);
            return;
        }

        // Autonomous idle messages skip emotion classification — they carry their own directive
        if (context.Message.Text == SynapseConstants.AutonomousIdleTrigger)
        {
            var existing = await _emotionalState.GetAsync(cardCtx.CharacterId, cancellationToken);
            context.Set(existing ?? new EmotionalState(
                CharacterId: cardCtx.CharacterId, CurrentEmotion: null,
                Intensity: 0f, PreviousEmotion: null, Momentum: 0f,
                TrajectoryLabel: null, LastUpdated: DateTimeOffset.UtcNow));
            context.Set(await _emotionalState.GetPhysicalAsync(cardCtx.CharacterId, cancellationToken));
            return;
        }

        EmotionalState updatedEmotion;
        PhysicalState  updatedPhysical;
        try
        {
            var classified = await _classifier.ClassifyAsync(
                context.Message.Text,
                cardCtx.Personality,
                cancellationToken,
                cardCtx.EmotionIntensityScale);

            var dynamics = cardCtx.EmotionDynamics ?? EmotionDynamics.Default;
            (updatedEmotion, updatedPhysical) = await _emotionalState.UpdateAsync(
                cardCtx.CharacterId,
                classified,
                dynamics,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                "[Scatter:{ShardId}] Emotion service unavailable ({Reason}), using neutral state. Correlation={Correlation}",
                ShardId, ex.Message, context.CorrelationId);
            context.Set(new EmotionalState(
                CharacterId: cardCtx.CharacterId, CurrentEmotion: null,
                Intensity: 0f, PreviousEmotion: null, Momentum: 0f,
                TrajectoryLabel: null, LastUpdated: DateTimeOffset.UtcNow));
            context.Set(PhysicalState.Default);
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[Scatter:{ShardId}] Unexpected error during emotion classification — using neutral state. Correlation={Correlation}",
                ShardId, context.CorrelationId);
            context.Set(new EmotionalState(
                CharacterId: cardCtx.CharacterId, CurrentEmotion: null,
                Intensity: 0f, PreviousEmotion: null, Momentum: 0f,
                TrajectoryLabel: null, LastUpdated: DateTimeOffset.UtcNow));
            context.Set(PhysicalState.Default);
            return;
        }

        context.Set(updatedEmotion);
        context.Set(updatedPhysical);

        // Notify idle tracker so autonomous speech threshold updates on each real message
        var vad = EmotionVadTable.Map(updatedEmotion.CurrentEmotion);
        _idleTracker.NotifyActivity(
            cardCtx.CharacterId,
            context.Message.ChannelId,
            context.Message.PlatformId,
            vad.A,
            updatedPhysical.Energy);

        _logger.LogDebug(
            "[Scatter:{ShardId}] {Prev}→{Curr} intensity={Intensity:F2} momentum={Momentum:F2} " +
            "trajectory={Trajectory} vad=({V:F2},{A:F2},{D:F2}) energy={Energy:F2} Correlation={Correlation}",
            ShardId,
            updatedEmotion.PreviousEmotion ?? "null",
            updatedEmotion.CurrentEmotion  ?? "null",
            updatedEmotion.Intensity,
            updatedEmotion.Momentum,
            updatedEmotion.TrajectoryLabel ?? "-",
            vad.V, vad.A, vad.D,
            updatedPhysical.Energy,
            context.CorrelationId);
    }

}
