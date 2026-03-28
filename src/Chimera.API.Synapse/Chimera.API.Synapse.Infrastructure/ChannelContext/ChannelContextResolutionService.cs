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

            if (channel?.AiCard is null)
            {
                _logger.LogWarning(
                    "[ChannelContext] No active AiCard for channel {Channel} — aborting. Correlation={Correlation}",
                    channelId,
                    context.CorrelationId);
                context.Abort();
                return;
            }

            var card = channel.AiCard;
            var memSettings = ParseMemorySettings(card.MemorySettings);
            var ttsConfig   = ParseTtsConfig(card.TtsConfig);

            cardCtx = new AiCardContext(
                AiCardId: card.Id,
                SystemPrompt: card.SystemPrompt,
                Personality: card.Personality,
                LlmProviderId: card.LlmCatalog?.Provider ?? "echo",
                LlmModel: card.LlmCatalog?.ModelId ?? string.Empty,
                MemoryEnabled: memSettings.Enabled,
                MaxMemories: memSettings.MaxMemories,
                TtsProviderId: card.TtsCatalog?.Provider,
                TtsVoiceId: card.TtsCatalog?.VoiceId,
                TtsModelId: ttsConfig.ModelId,
                TtsSpeed: ttsConfig.Speed);

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

    private static MemorySettingsDto ParseMemorySettings(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<MemorySettingsDto>(json,
                       new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                   ?? new MemorySettingsDto();
        }
        catch
        {
            return new MemorySettingsDto();
        }
    }

    private static TtsConfigDto ParseTtsConfig(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new TtsConfigDto();

        try
        {
            return JsonSerializer.Deserialize<TtsConfigDto>(json,
                       new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                   ?? new TtsConfigDto();
        }
        catch
        {
            return new TtsConfigDto();
        }
    }

    #endregion

    #region Nested Types

    private sealed class MemorySettingsDto
    {
        public bool Enabled { get; set; } = true;
        public int MaxMemories { get; set; } = 5;
    }

    private sealed class TtsConfigDto
    {
        public float Speed { get; set; } = 1.0f;
        public string? ModelId { get; set; }
    }

    #endregion
}
