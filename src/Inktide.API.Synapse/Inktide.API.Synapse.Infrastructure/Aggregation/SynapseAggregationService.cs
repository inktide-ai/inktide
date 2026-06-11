using System.Text.Json;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Aggregation;

/// <summary>Fan-in: publishes aggregated context envelope to the LLM Redis stream.</summary>
internal sealed class SynapseAggregationService : ISynapseAggregationService
{

    private readonly IConnectionMultiplexer _redis;
    private readonly IOptions<SynapseAggregationOptions> _options;
    private readonly ILogger<SynapseAggregationService> _logger;

    public SynapseAggregationService(
        IConnectionMultiplexer redis,
        IOptions<SynapseAggregationOptions> options,
        ILogger<SynapseAggregationService> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task AggregateAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var envelope = new SynapseAggregatedEnvelope(
            context.TransportMessageId,
            string.IsNullOrEmpty(context.CorrelationId) ? context.TransportMessageId : context.CorrelationId,
            DateTimeOffset.UtcNow,
            context.Message,
            context.Get<RagContext>(),
            BuildContextPayload(context),
            context.Get<SessionContext>(),
            context.Get<EmotionalState>(),
            Screen:   context.Get<ScreenContext>(),
            Webhook:  context.Get<WebhookContext>(),
            Physical: context.Get<PhysicalState>());

        var json = JsonSerializer.Serialize(envelope, SynapseConstants.Json.Write);
        var opt = _options.Value;

        var db = _redis.GetDatabase();
        
        await db.StreamAddAsync(
            opt.LlmStreamName,
            [new NameValueEntry("payload", json)],
            maxLength: (int)opt.ApproximateMaxLength,
            useApproximateMaxLength: true,
            flags: CommandFlags.None);

        _logger.LogInformation(
            "Envelope published to LLM stream. Stream={Stream} Correlation={Correlation}",
            opt.LlmStreamName,
            envelope.CorrelationId);
    }

    private static ContextShardPayload? BuildContextPayload(MessageProcessingContext context)
    {
        var cardCtx = context.Get<AiCardContext>();
        if (cardCtx is null) return null;

        // Intentionally excluded from envelope — pipeline-internal, not consumed by the LLM worker:
        //   EmotionDynamics        → consumed by EmotionScatterShard / RedisEmotionalStateService
        //   EmotionIntensityScale  → applied to EmotionalState.Intensity inside LlmStreamWorker
        //   ProjectId / ActiveRunPreset* → diagnostics only, no downstream consumer
        //   ScreenAwarenessEnabled → resolved events travel as ScreenContext shard output
        const int maxPreview = 2000;
        var preview = context.Message.Text is { Length: > maxPreview } t
            ? t[..maxPreview] + "…"
            : context.Message.Text;

        return new ContextShardPayload(
            cardCtx.CharacterId,
            cardCtx.UserId,
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
            ResponseDelayMs:        cardCtx.ResponseDelayMs,
            LlmBaseUrl:             cardCtx.LlmBaseUrl,
            LlmRequiresApiKey:      cardCtx.LlmRequiresApiKey,
            EmotionResponsiveness:  cardCtx.EmotionResponsiveness,
            PersonalityDirective:   cardCtx.PersonalityDirective,
            Plugins:                cardCtx.Plugins);
    }

}
