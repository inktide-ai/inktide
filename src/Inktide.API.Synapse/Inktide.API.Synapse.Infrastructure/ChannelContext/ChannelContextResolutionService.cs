using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Inktide.API.Synapse.Infrastructure.Llm;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.ChannelContext;

/// <summary>
/// Resolves the active <see cref="AiCardContext"/> for the inbound channel (prerequisite for scatter).
/// Uses <see cref="IAiCardChannelQueryService"/> so Synapse stays decoupled from Soul's DB context.
/// Run preset overrides are applied after the base context is built and are NOT cached —
/// allowing the active scene to change at runtime without requiring a cache flush.
/// </summary>
public sealed class ChannelContextResolutionService : IChannelContextResolutionService
{

    private readonly IAiCardChannelQueryService _cardQuery;
    private readonly IProjectBySoulQuery? _projectQuery;
    private readonly IAiCardRunPresetQueryService? _runPresetQuery;
    private readonly ChannelContextCache _cache;
    private readonly ILogger<ChannelContextResolutionService> _logger;

    public ChannelContextResolutionService(
        IAiCardChannelQueryService cardQuery,
        ChannelContextCache cache,
        ILogger<ChannelContextResolutionService> logger,
        IProjectBySoulQuery? projectQuery = null,
        IAiCardRunPresetQueryService? runPresetQuery = null)
    {
        _cardQuery      = cardQuery ?? throw new ArgumentNullException(nameof(cardQuery));
        _cache          = cache     ?? throw new ArgumentNullException(nameof(cache));
        _logger         = logger    ?? throw new ArgumentNullException(nameof(logger));
        _projectQuery   = projectQuery;
        _runPresetQuery = runPresetQuery;
    }


    public async Task ResolveAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var channelId = context.Message.ChannelId;

        var cardCtx = await _cache.GetOrSetAsync(channelId, async () =>
        {
            AiCardChannelContext? raw = await _cardQuery.ResolveByChannelIdAsync(channelId, cancellationToken);

            // Inktide-chat fallback: channelId is "{cardId}:{userId}" — resolve directly by card ID.
            if (raw is null && context.Message.PlatformId == SynapseConstants.Platforms.InktideChat)
                raw = await TryResolveInktideChatAsync(channelId, cancellationToken);

            if (raw is null)
                return null;

            var llm      = raw.LlmConfig;
            var tts      = raw.TtsConfig;
            var behavior = raw.Behavior;
            var memory   = raw.Memory;

            // Prefer tts_config fields (new UI) over LlmCatalog TTS provider (legacy fallback).
            var ttsProvider = NullIfEmpty(tts.ProviderId);
            var ttsVoice    = NullIfEmpty(tts.VoiceId);
            // 'none' provider means TTS is explicitly disabled.
            if (string.Equals(ttsProvider, "none", StringComparison.OrdinalIgnoreCase))
                ttsProvider = null;

            var personality = raw.PersonalityConfig;
            var personalitySnapshot = new SynapsePersonalitySnapshot(
                Warmth:                personality.Warmth,
                Playfulness:           personality.Playfulness,
                Assertiveness:         personality.Assertiveness,
                Empathy:               personality.Empathy,
                Formality:             personality.Formality,
                Sarcasm:               personality.Sarcasm,
                EmotionVolatility:     personality.EmotionVolatility,
                EmotionResponsiveness: personality.EmotionResponsiveness,
                EmotionMemory:         personality.EmotionMemory,
                StressBehavior:        personality.StressBehavior,
                BaselineMood:          personality.BaselineMood);

            AiCardContext resolved = new(
                CharacterId:           raw.AiCardId,
                UserId:                raw.UserId,
                SystemPrompt:          raw.SystemPrompt,
                Personality:           raw.Personality,
                LlmProviderId:         raw.LlmProvider ?? SynapseConstants.Providers.EchoProvider,
                LlmModel:              NullIfEmpty(llm.ModelId) ?? raw.LlmModelId ?? string.Empty,
                MemoryEnabled:         memory.Enabled,
                MaxMemories:           memory.MaxMemories,
                TtsProviderId:         ttsProvider,
                TtsVoiceId:            ttsVoice,
                TtsModelId:            tts.ModelId,
                TtsSpeed:              tts.Speed,
                ChunkingMode:          behavior.ChunkingMode,
                Language:              behavior.Language,
                LlmTemperature:        llm.Temperature,
                LlmMaxTokens:          llm.MaxTokens,
                LlmTopP:               llm.TopP,
                LlmFrequencyPenalty:   llm.FrequencyPenalty,
                LlmPresencePenalty:    llm.PresencePenalty,
                ResponseDelayMs:       behavior.ResponseDelayMs,
                LlmBaseUrl:            NullIfEmpty(llm.BaseUrl),
                EmotionIntensityScale: behavior.EmotionIntensityScale,
                PersonalityDirective:  PersonalityDirectiveBuilder.Build(personalitySnapshot),
                EmotionResponsiveness: personality.EmotionResponsiveness,
                EmotionDynamics:       new EmotionDynamics(
                    personality.EmotionVolatility,
                    personality.EmotionResponsiveness,
                    personality.EmotionMemory),
                ScreenAwarenessEnabled: raw.ScreenAwarenessEnabled);

            // Resolve which Project (if any) has this Soul as its active execution profile.
            if (_projectQuery is not null)
            {
                var projectLink = await _projectQuery.FindProjectIdBySoulIdAsync(raw.AiCardId, cancellationToken);
                if (projectLink is not null)
                    resolved = resolved with {
                        ProjectId    = projectLink.Id,
                        SystemPrompt = NullIfEmpty(projectLink.SystemPrompt) ?? resolved.SystemPrompt,
                        Plugins      = projectLink.Plugins,
                    };
            }

            _logger.LogDebug(
                "[ChannelContext] Resolved AiCard {CardId} for channel {Channel} (ProjectId={ProjectId})",
                raw.AiCardId, channelId, resolved.ProjectId);

            return resolved;
        });

        if (cardCtx is null)
        {
            _logger.LogWarning(
                "[ChannelContext] No active AiCard for channel {Channel} — aborting. Correlation={Correlation}",
                channelId, context.CorrelationId);
            context.Abort();
            return;
        }

        // Apply active run preset overrides (not cached — preset may change at runtime).
        if (_runPresetQuery is not null)
        {
            var preset = await _runPresetQuery.GetActiveForCardAsync(cardCtx.CharacterId, cancellationToken);
            if (preset is not null)
            {
                cardCtx = cardCtx with
                {
                    LlmModel            = preset.OverrideLlmModelId ?? cardCtx.LlmModel,
                    LlmTemperature      = preset.OverrideTemperature ?? cardCtx.LlmTemperature,
                    TtsVoiceId          = preset.OverrideVoiceProfileId ?? cardCtx.TtsVoiceId,
                    ActiveRunPresetId   = preset.Id,
                    ActiveRunPresetName = preset.Name,
                };

                _logger.LogDebug(
                    "[ChannelContext] Run preset '{PresetName}' ({PresetId}) applied for card {CardId}",
                    preset.Name, preset.Id, cardCtx.CharacterId);
            }
        }

        context.Set(cardCtx);
    }


    private async Task<AiCardChannelContext?> TryResolveInktideChatAsync(
        string channelId,
        CancellationToken ct)
    {
        if (!InktideChatChannelParser.TryParseCardId(channelId, out var cardId))
        {
            _logger.LogWarning(
                "[ChannelContext] inktide-chat channelId '{ChannelId}' has no valid cardId prefix",
                channelId);
            return null;
        }

        var result = await _cardQuery.ResolveByCardIdAsync(cardId, ct);
        if (result is null)
            _logger.LogWarning("[ChannelContext] inktide-chat card {CardId} not found", cardId);
        else
            _logger.LogDebug(
                "[ChannelContext] inktide-chat resolved AiCard {CardId} from channel {Channel}",
                cardId, channelId);

        return result;
    }


    private static string? NullIfEmpty(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;

}
