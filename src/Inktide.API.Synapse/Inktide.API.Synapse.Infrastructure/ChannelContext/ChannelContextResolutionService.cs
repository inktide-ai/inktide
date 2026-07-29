using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.ValueObjects;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Inktide.API.Synapse.Infrastructure.Llm;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Synapse.Infrastructure.ChannelContext;

/// <summary>
/// Resolves the active <see cref="AiCardContext"/> for the inbound channel (prerequisite for scatter).
/// Uses <see cref="IAiCardChannelQueryService"/> so Synapse stays decoupled from Soul's DB context.
/// Run preset overrides are applied after the base context is built and are NOT cached -
/// allowing the active scene to change at runtime without requiring a cache flush.
/// </summary>
internal sealed class ChannelContextResolutionService : IChannelContextResolutionService
{

    private readonly IAiCardChannelQueryService _cardQuery;
    private readonly IProjectBySoulQuery? _projectQuery;
    private readonly IAiCardRunPresetQueryService? _runPresetQuery;
    private readonly ChannelContextCache _cache;
    private readonly IMemoryCache _presetCache;
    private readonly ILogger<ChannelContextResolutionService> _logger;
    private readonly SynapseSettings _settings;

    public ChannelContextResolutionService(
        IAiCardChannelQueryService cardQuery,
        ChannelContextCache cache,
        IMemoryCache presetCache,
        ILogger<ChannelContextResolutionService> logger,
        IOptions<SynapseSettings> settings,
        IProjectBySoulQuery? projectQuery = null,
        IAiCardRunPresetQueryService? runPresetQuery = null)
    {
        _cardQuery    = cardQuery    ?? throw new ArgumentNullException(nameof(cardQuery));
        _cache        = cache        ?? throw new ArgumentNullException(nameof(cache));
        _presetCache  = presetCache  ?? throw new ArgumentNullException(nameof(presetCache));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
        _settings     = settings.Value;
        _projectQuery = projectQuery;
        _runPresetQuery = runPresetQuery;
    }


    public async Task ResolveAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var channelId = context.Message.ChannelId;

        var cardCtx = await _cache.GetOrSetAsync(channelId, async () =>
        {
            AiCardChannelContext? raw = await _cardQuery.ResolveByChannelIdAsync(channelId, cancellationToken);

            // Inktide-chat fallback: channelId is "{cardId}:{userId}" - resolve directly by card ID.
            if (raw is null && context.Message.PlatformId == SynapseConstants.Platforms.InktideChat)
                raw = await TryResolveInktideChatAsync(channelId, cancellationToken);

            // Connector fallback: channel registry moved to Project context and ResolveByChannelId is a no-op.
            // Connectors (Discord, Twitch, Telegram) already embed CharacterId in the message - use it directly.
            if (raw is null && context.Message.CharacterId.HasValue)
                raw = await _cardQuery.ResolveByCardIdAsync(context.Message.CharacterId.Value, cancellationToken);

            if (raw is null)
                return null;

            var llm = raw.LlmConfig;
            var tts = raw.TtsConfig;

            // Prefer tts_config fields (new UI) over LlmCatalog TTS provider (legacy fallback).
            var ttsProvider = NullIfEmpty(tts.ProviderId);
            var ttsVoice    = NullIfEmpty(tts.VoiceId);
            // 'none' provider means TTS is explicitly disabled.
            if (string.Equals(ttsProvider, "none", StringComparison.OrdinalIgnoreCase))
                ttsProvider = null;

            // Behavior config (personality, system prompt, response behavior, memory, screen awareness)
            // has moved to the Project context. Defaults are used until Synapse reads from Project.
            var defaultPersonality = new SynapsePersonalitySnapshot(
                Warmth: 0.7f, Playfulness: 0.5f, Assertiveness: 0.5f,
                Empathy: 0.7f, Formality: 0.3f, Sarcasm: 0.2f,
                EmotionVolatility: 0.5f, EmotionResponsiveness: 0.7f, EmotionMemory: 0.5f,
                StressBehavior: "deflect", BaselineMood: "neutral");

            AiCardContext resolved = new(
                CharacterId:            raw.AiCardId,
                UserId:                 raw.UserId,
                SystemPrompt:           _settings.DefaultSystemPrompt,
                Personality:            string.Empty,
                LlmProviderId:          raw.LlmProvider ?? SynapseConstants.Providers.EchoProvider,
                LlmModel:               NullIfEmpty(llm.ModelId) ?? raw.LlmModelId ?? string.Empty,
                MemoryEnabled:          false,
                MaxMemories:            0,
                TtsProviderId:          ttsProvider,
                TtsVoiceId:             ttsVoice,
                TtsModelId:             StripProviderPrefix(tts.ModelId, ttsProvider),
                TtsSpeed:               tts.Speed,
                ChunkingMode:           "sentence",
                Language:               "en",
                LlmTemperature:         llm.Temperature,
                LlmMaxTokens:           llm.MaxTokens,
                LlmTopP:                llm.TopP,
                LlmFrequencyPenalty:    llm.FrequencyPenalty,
                LlmPresencePenalty:     llm.PresencePenalty,
                ResponseDelayMs:        0,
                LlmBaseUrl:             NullIfEmpty(llm.BaseUrl),
                LlmRequiresApiKey:      raw.LlmRequiresApiKey,
                EmotionIntensityScale:  1.0f,
                PersonalityDirective:   PersonalityDirectiveBuilder.Build(defaultPersonality),
                EmotionResponsiveness:  defaultPersonality.EmotionResponsiveness,
                EmotionDynamics:        new EmotionDynamics(
                    defaultPersonality.EmotionVolatility,
                    defaultPersonality.EmotionResponsiveness,
                    defaultPersonality.EmotionMemory),
                ScreenAwarenessEnabled: false,
                TtsBaseUrl:             NullIfEmpty(tts.BaseUrl),
                TtsProviderParamsJson:  SerializeTtsProviderParams(tts));

            // Resolve which Project (if any) has this Soul as its active execution profile.
            // The Project now owns behavior config - it overrides defaults set above.
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

        // Apply active run preset overrides. Short TTL cache (500ms) eliminates per-message DB round trips
        // in steady state while keeping sub-second responsiveness to runtime preset changes.
        if (_runPresetQuery is not null)
        {
            var presetKey = SynapseConstants.Cache.RunPresetKeyPrefix + cardCtx.CharacterId.ToString("N");
            if (!_presetCache.TryGetValue(presetKey, out ActiveRunPresetDto? preset))
            {
                preset = await _runPresetQuery.GetActiveForCardAsync(cardCtx.CharacterId, cancellationToken);
                _presetCache.Set(presetKey, preset, SynapseConstants.Cache.RunPresetTtl);
            }

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

    private static string SerializeTtsProviderParams(TtsConfigSettings tts) =>
        JsonSerializer.Serialize(new
        {
            stability         = tts.Stability,
            similarity_boost  = tts.SimilarityBoost,
            style             = tts.Style,
            use_speaker_boost = tts.UseSpeakerBoost,
            pitch             = tts.Pitch,
            volume            = tts.Volume,
        });

    /// <summary>
    /// Validates namespaced model IDs (airi pattern: "providerId/modelId").
    /// - Prefixed and matching provider  -> strip prefix, return tail ("elevenlabs/tts-1" + "elevenlabs" -> "tts-1")
    /// - Prefixed with wrong provider    -> return null (contamination from another provider)
    /// - No prefix                       -> return as-is (backwards-compat, valid for any provider)
    /// </summary>
    private static string? StripProviderPrefix(string? modelId, string? providerId)
    {
        if (string.IsNullOrWhiteSpace(modelId)) return null;
        var slashIndex = modelId.IndexOf('/');
        if (slashIndex < 0) return modelId; // un-prefixed: valid for any provider
        var prefix = modelId[..slashIndex];
        if (string.Equals(prefix, providerId, StringComparison.OrdinalIgnoreCase))
            return modelId[(slashIndex + 1)..];
        return null; // wrong provider prefix -> use provider default
    }

}
