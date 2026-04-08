using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Scatter shard: builds a JSON-friendly <see cref="ContextShardPayload"/> from the resolved card + inbound text.
/// Runs in parallel with Session and RAG I/O.
/// </summary>
public sealed class ContextScatterShard : ISynapseScatterShard
{
    #region Fields

    private const int MaxPreviewLength = 2000;
    private readonly ILogger<ContextScatterShard> _logger;

    #endregion

    #region Properties

    public string ShardId => "context";

    #endregion

    #region Constructors

    public ContextScatterShard(ILogger<ContextScatterShard> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();
        
        if (cardCtx is null)
        {
            return Task.CompletedTask;
        }

        var preview = context.Message.Text;
        if (preview.Length > MaxPreviewLength)
        {
            preview = preview[..MaxPreviewLength] + "…";
        }

        var payload = new ContextShardPayload(
            cardCtx.AiCardId,
            context.Message.ChannelId,
            context.Message.ChannelName,
            cardCtx.SystemPrompt,
            cardCtx.Personality,
            cardCtx.LlmProviderId,
            cardCtx.LlmModel,
            cardCtx.MemoryEnabled,
            cardCtx.MaxMemories,
            preview,
            cardCtx.TtsProviderId,
            cardCtx.TtsVoiceId,
            cardCtx.TtsModelId,
            cardCtx.TtsSpeed,
            cardCtx.ChunkingMode,
            cardCtx.Language,
            LlmTemperature:      cardCtx.LlmTemperature,
            LlmMaxTokens:        cardCtx.LlmMaxTokens,
            LlmTopP:             cardCtx.LlmTopP,
            LlmFrequencyPenalty: cardCtx.LlmFrequencyPenalty,
            LlmPresencePenalty:  cardCtx.LlmPresencePenalty,
            ResponseDelayMs:     cardCtx.ResponseDelayMs);

        context.Set(payload);

        _logger.LogDebug(
            "[Scatter:{ShardId}] Context envelope for card {CardId}. Correlation={Correlation}",
            ShardId,
            cardCtx.AiCardId,
            context.CorrelationId);

        return Task.CompletedTask;
    }

    #endregion
}
