using System.Text.Json;
using Chimera.API.Soul.Infrastructure.DbContext;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Synapse.Infrastructure.ChannelContext;

/// <summary>
/// Resolves the active <see cref="AiCardContext"/> for the inbound channel (prerequisite for scatter).
/// </summary>
public sealed class ChannelContextResolutionService : IChannelContextResolutionService
{
    #region Fields

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Handles snake_case JSON keys from the frontend (e.g. max_tokens → MaxTokens).
    /// PropertyNameCaseInsensitive alone does NOT strip underscores; SnakeCaseLower + CaseInsensitive does.
    /// </summary>
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    private readonly SoulDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ChannelContextResolutionService> _logger;

    #endregion

    #region Constructors

    public ChannelContextResolutionService(
        SoulDbContext db,
        IMemoryCache cache,
        ILogger<ChannelContextResolutionService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task ResolveAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var channelId = context.Message.ChannelId;
        var cacheKey = $"ctx:channel:{channelId}";

        if (!_cache.TryGetValue(cacheKey, out AiCardContext? cardCtx))
        {
            var channel = await _db.AiCardChannels
                .AsNoTracking()
                .Include(c => c.AiCard)
                    .ThenInclude(a => a!.LlmCatalog)
                .Include(c => c.AiCard)
                    .ThenInclude(a => a!.TtsCatalog)
                .FirstOrDefaultAsync(
                    c => c.ChannelId == channelId && c.IsActive,
                    cancellationToken);

            // Chimera-chat fallback: channelId is "{cardId}:{userId}" — resolve directly by card ID.
            var card = channel?.AiCard
                       ?? (context.Message.PlatformId == "chimera-chat"
                           ? await TryResolveChimeraChatCardAsync(channelId, cancellationToken)
                           : null);

            if (card is null)
            {
                _logger.LogWarning(
                    "[ChannelContext] No active AiCard for channel {Channel} — aborting. Correlation={Correlation}",
                    channelId,
                    context.CorrelationId);
                context.Abort();
                return;
            }
            var memSettings = ParseMemorySettings(card.MemorySettings);
            var ttsConfig   = ParseTtsConfig(card.TtsConfig);
            var behavior    = ParseBehavior(card.ResponseBehavior);

            var llmCfg = ParseLlmConfig(card.LlmConfig);

            // Prefer tts_config fields (new UI) over TtsCatalog (legacy fallback).
            var ttsProvider = NullIfEmpty(ttsConfig.ProviderId) ?? card.TtsCatalog?.Provider;
            var ttsVoice    = NullIfEmpty(ttsConfig.VoiceId)    ?? card.TtsCatalog?.VoiceId;
            // 'none' provider means TTS is explicitly disabled.
            if (string.Equals(ttsProvider, "none", StringComparison.OrdinalIgnoreCase))
                ttsProvider = null;

            cardCtx = new AiCardContext(
                AiCardId: card.Id,
                SystemPrompt: card.SystemPrompt,
                Personality: card.Personality,
                LlmProviderId: card.LlmCatalog?.Provider ?? "echo",
                LlmModel: card.LlmCatalog?.ModelId ?? string.Empty,
                MemoryEnabled: memSettings.Enabled,
                MaxMemories: memSettings.MaxMemories,
                TtsProviderId: ttsProvider,
                TtsVoiceId: ttsVoice,
                TtsModelId: ttsConfig.ModelId,
                TtsSpeed: ttsConfig.Speed,
                ChunkingMode: behavior.ChunkingMode,
                Language: behavior.Language,
                LlmTemperature: llmCfg.Temperature,
                LlmMaxTokens: llmCfg.MaxTokens,
                LlmTopP: llmCfg.TopP,
                LlmFrequencyPenalty: llmCfg.FrequencyPenalty,
                LlmPresencePenalty: llmCfg.PresencePenalty,
                ResponseDelayMs: behavior.ResponseDelayMs);

            _cache.Set(cacheKey, cardCtx, CacheTtl);

            _logger.LogDebug(
                "[ChannelContext] Resolved AiCard {CardId} for channel {Channel}",
                card.Id,
                channelId);
        }

        context.Set(cardCtx!);
    }

    #endregion

    #region Private Methods

    /// <summary>
    /// Chimera-chat bypass: <paramref name="channelId"/> is <c>"{cardId}:{userId}"</c>.
    /// Parses the first segment as a GUID and looks up the AI card directly —
    /// no <c>AiCardChannels</c> entry required for browser-based test chat.
    /// </summary>
    private async Task<Chimera.API.Soul.Domain.Entities.AiCard?> TryResolveChimeraChatCardAsync(
        string channelId,
        CancellationToken ct)
    {
        var cardIdStr = channelId.Split(':')[0];
        if (!Guid.TryParse(cardIdStr, out var cardId))
        {
            _logger.LogWarning(
                "[ChannelContext] chimera-chat channelId '{ChannelId}' has no valid cardId prefix",
                channelId);
            return null;
        }

        var card = await _db.AiCards
            .AsNoTracking()
            .Include(a => a.LlmCatalog)
            .Include(a => a.TtsCatalog)
            .FirstOrDefaultAsync(a => a.Id == cardId && a.DeletedAt == null, ct);

        if (card is null)
            _logger.LogWarning("[ChannelContext] chimera-chat card {CardId} not found", cardId);
        else
            _logger.LogDebug("[ChannelContext] chimera-chat resolved AiCard {CardId} from channel {Channel}", cardId, channelId);

        return card;
    }

    private static MemorySettingsDto ParseMemorySettings(string json)
    {
        try { return JsonSerializer.Deserialize<MemorySettingsDto>(json, JsonOpts) ?? new MemorySettingsDto(); }
        catch { return new MemorySettingsDto(); }
    }

    private static BehaviorDto ParseBehavior(string json)
    {
        try { return JsonSerializer.Deserialize<BehaviorDto>(json, JsonOpts) ?? new BehaviorDto(); }
        catch { return new BehaviorDto(); }
    }

    private static LlmConfigDto ParseLlmConfig(string json)
    {
        try { return JsonSerializer.Deserialize<LlmConfigDto>(json, JsonOpts) ?? new LlmConfigDto(); }
        catch { return new LlmConfigDto(); }
    }

    private static TtsConfigDto ParseTtsConfig(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new TtsConfigDto();
        try { return JsonSerializer.Deserialize<TtsConfigDto>(json, JsonOpts) ?? new TtsConfigDto(); }
        catch { return new TtsConfigDto(); }
    }

    private static string? NullIfEmpty(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;

    #endregion

    #region Nested Types

    private sealed class MemorySettingsDto
    {
        public bool Enabled { get; set; } = true;
        public int MaxMemories { get; set; } = 5;
    }

    private sealed class BehaviorDto
    {
        public string ChunkingMode { get; set; } = "narration";
        public string? Language { get; set; }
        public int ResponseDelayMs { get; set; } = 0;
    }

    private sealed class LlmConfigDto
    {
        public float Temperature { get; set; } = 0.7f;
        public int MaxTokens { get; set; } = 512;
        public float TopP { get; set; } = 0.9f;
        public float FrequencyPenalty { get; set; } = 0f;
        public float PresencePenalty { get; set; } = 0f;
    }

    private sealed class TtsConfigDto
    {
        public string? ProviderId { get; set; }
        public string? VoiceId { get; set; }
        public float Speed { get; set; } = 1.0f;
        public string? ModelId { get; set; }
        public string? ApiKey { get; set; }
        public string? BaseUrl { get; set; }
    }

    #endregion
}
