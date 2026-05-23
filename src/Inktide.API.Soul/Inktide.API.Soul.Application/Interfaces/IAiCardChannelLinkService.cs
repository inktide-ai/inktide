using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>User-owned links between an AI card and external chat platforms (Discord, Twitch, …).</summary>
public interface IAiCardChannelLinkService
{
    Task<ChannelLink> CreateAsync(
        Guid userId,
        Guid cardId,
        CreateChannelLinkCommand command,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken cancellationToken = default);

    Task<ChannelLink> PatchAsync(
        Guid userId,
        Guid cardId,
        Guid linkId,
        PatchChannelLinkCommand command,
        CancellationToken cancellationToken = default);

    // ── Discord OAuth2 ──────────────────────────────────────────────────────

    Task UpsertDiscordChannelAsync(
        Guid userId,
        Guid cardId,
        string guildId,
        string guildName,
        string accessTokenEnc,
        string refreshTokenEnc,
        DateTime tokenExpiresAt,
        CancellationToken ct = default);

    // ── Twitch OAuth2 ───────────────────────────────────────────────────────

    Task UpsertTwitchChannelAsync(
        Guid userId,
        Guid cardId,
        string channelLogin,
        string botUsername,
        string accessTokenEnc,
        string refreshTokenEnc,
        DateTime tokenExpiresAt,
        CancellationToken ct = default);

    // ── Telegram Bot Token ──────────────────────────────────────────────────

    Task<Guid> UpsertTelegramChannelAsync(
        Guid userId,
        Guid cardId,
        string chatId,
        string chatName,
        string encryptedBotToken,
        CancellationToken ct = default);

    Task<AiCardChannel?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default);

    Task DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default);

    Task SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default);
}
