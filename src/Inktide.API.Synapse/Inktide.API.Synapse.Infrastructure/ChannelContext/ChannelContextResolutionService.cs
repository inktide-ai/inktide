using System.Text.Json;
using Inktide.API.Soul.Infrastructure.DbContext;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.ChannelContext;

/// <summary>
/// Resolves the active <see cref="AiCardContext"/> for the inbound channel (prerequisite for scatter).
/// </summary>
public sealed class ChannelContextResolutionService : IChannelContextResolutionService
{

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

    public ChannelContextResolutionService(
        SoulDbContext db,
        IMemoryCache cache,
        ILogger<ChannelContextResolutionService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


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

            // Inktide-chat fallback: channelId is "{cardId}:{userId}" — resolve directly by card ID.
            var card = channel?.AiCard
                       ?? (context.Message.PlatformId == "inktide-chat"
                           ? await TryResolveInktideChatCardAsync(channelId, cancellationToken)
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
                UserId: card.UserId,
                SystemPrompt: card.SystemPrompt,
                Personality: card.Personality,
                LlmProviderId: card.LlmCatalog?.Provider ?? "echo",
                LlmModel: NullIfEmpty(llmCfg.ModelId) ?? card.LlmCatalog?.ModelId ?? string.Empty,
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
                ResponseDelayMs: behavior.ResponseDelayMs,
                LlmBaseUrl: NullIfEmpty(llmCfg.BaseUrl),
                EmotionIntensityScale: behavior.EmotionIntensityScale);

            _cache.Set(cacheKey, cardCtx, CacheTtl);

            _logger.LogDebug(
                "[ChannelContext] Resolved AiCard {CardId} for channel {Channel}",
                card.Id,
                channelId);
        }

        context.Set(cardCtx!);
    }


    /// <summary>
    /// Inktide-chat bypass: <paramref name="channelId"/> is <c>"{cardId}:{userId}"</c>.
    /// Parses the first segment as a GUID and looks up the AI card directly —
    /// no <c>AiCardChannels</c> entry required for browser-based test chat.
    /// </summary>
    private async Task<Inktide.API.Soul.Domain.Entities.AiCard?> TryResolveInktideChatCardAsync(
        string channelId,
        CancellationToken ct)
    {
        var cardIdStr = channelId.Split(':')[0];
        if (!Guid.TryParse(cardIdStr, out var cardId))
        {
            _logger.LogWarning(
                "[ChannelContext] inktide-chat channelId '{ChannelId}' has no valid cardId prefix",
                channelId);
            return null;
        }

        var card = await _db.AiCards
            .AsNoTracking()
            .Include(a => a.LlmCatalog)
            .Include(a => a.TtsCatalog)
            .FirstOrDefaultAsync(a => a.Id == cardId && a.DeletedAt == null, ct);

        if (card is null)
            _logger.LogWarning("[ChannelContext] inktide-chat card {CardId} not found", cardId);
        else
            _logger.LogDebug("[ChannelContext] inktide-chat resolved AiCard {CardId} from channel {Channel}", cardId, channelId);

        return card;
    }

    private static MemorySettings ParseMemorySettings(string json)
    {
        try { return JsonSerializer.Deserialize<MemorySettings>(json, JsonOpts) ?? new MemorySettings(); }
        catch { return new MemorySettings(); }
    }

    private static Behavior ParseBehavior(string json)
    {
        try { return JsonSerializer.Deserialize<Behavior>(json, JsonOpts) ?? new Behavior(); }
        catch { return new Behavior(); }
    }

    private static LlmConfig ParseLlmConfig(string json)
    {
        try { return JsonSerializer.Deserialize<LlmConfig>(json, JsonOpts) ?? new LlmConfig(); }
        catch { return new LlmConfig(); }
    }

    private static TtsConfig ParseTtsConfig(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new TtsConfig();
        try { return JsonSerializer.Deserialize<TtsConfig>(json, JsonOpts) ?? new TtsConfig(); }
        catch { return new TtsConfig(); }
    }

    private static string? NullIfEmpty(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;


    private sealed class MemorySettings
    {
        public bool Enabled { get; set; } = true;
        public int MaxMemories { get; set; } = 5;
    }

    private sealed class Behavior
    {
        public string ChunkingMode { get; set; } = "narration";
        public string? Language { get; set; }
        public int ResponseDelayMs { get; set; } = 0;
        public float EmotionIntensityScale { get; set; } = 1.0f;
    }

    private sealed class LlmConfig
    {
        public float Temperature { get; set; } = 0.7f;
        public int MaxTokens { get; set; } = 512;
        public float TopP { get; set; } = 0.9f;
        public float FrequencyPenalty { get; set; } = 0f;
        public float PresencePenalty { get; set; } = 0f;
        /// <summary>Per-card model override stored by the frontend as llm_config.model_id.</summary>
        public string? ModelId { get; set; }
        /// <summary>Per-card endpoint override stored by the frontend as llm_config.base_url.</summary>
        public string? BaseUrl { get; set; }
    }

    private sealed class TtsConfig
    {
        public string? ProviderId { get; set; }
        public string? VoiceId { get; set; }
        public float Speed { get; set; } = 1.0f;
        public string? ModelId { get; set; }
        public string? ApiKey { get; set; }
        public string? BaseUrl { get; set; }
    }

}
