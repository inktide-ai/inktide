using Inktide.API.Core.Generators;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

public sealed class AiCardChannelLinkService : IAiCardChannelLinkService
{

    private readonly IAiCardRepository _cardRepo;
    private readonly IAiCardChannelRepository _channelRepo;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardChannelLinkService> _logger;


    public AiCardChannelLinkService(
        IAiCardRepository cardRepo,
        IAiCardChannelRepository channelRepo,
        TimeProvider time,
        ILogger<AiCardChannelLinkService> logger)
    {
        _cardRepo = cardRepo ?? throw new ArgumentNullException(nameof(cardRepo));
        _channelRepo = channelRepo ?? throw new ArgumentNullException(nameof(channelRepo));
        _time = time ?? throw new ArgumentNullException(nameof(time));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<ChannelLink> CreateAsync(
        Guid userId,
        Guid cardId,
        CreateChannelLinkCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var card = await _cardRepo.GetByIdAsync(cardId, cancellationToken);
        if (card is null || card.UserId != userId)
        {
            throw new AiCardNotFoundException(cardId);
        }

        var platform = command.Platform.Trim().ToLowerInvariant();
        var channelName = command.ChannelName.Trim();
        var botUsername = command.BotUsername.Trim();
        var channelId = string.IsNullOrWhiteSpace(command.ChannelId) ? null : command.ChannelId.Trim();

        var existing = await _channelRepo.GetByCardIdAsync(cardId, cancellationToken);
        if (existing.Any(
                c => string.Equals(c.Platform, platform, StringComparison.OrdinalIgnoreCase)
                     && string.Equals(c.ChannelName, channelName, StringComparison.Ordinal)))
        {
            throw new ChannelLinkConflictException(
                "A link with the same platform and display name already exists for this character.");
        }

        if (!string.IsNullOrEmpty(channelId)
            && existing.Any(
                c => string.Equals(c.Platform, platform, StringComparison.OrdinalIgnoreCase)
                     && c.ChannelId == channelId))
        {
            throw new ChannelLinkConflictException(
                "This channel routing id is already linked to this character on this platform.");
        }

        var now = _time.GetUtcNow().UtcDateTime;
        var entity = new AiCardChannel
        {
            Id = IdGenerator.New(),
            AiCardId = cardId,
            Platform = platform,
            ChannelName = channelName,
            ChannelId = channelId,
            BotUsername = botUsername,
            OAuthTokenEnc = null,
            IsActive = true,
            ConnectedAt = now,
            CreatedAt = now
        };

        await _channelRepo.CreateAsync(entity, cancellationToken);

        _logger.LogInformation(
            "User {UserId} linked card {CardId} to {Platform} channel {ChannelName}",
            userId,
            cardId,
            platform,
            channelName);

        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken cancellationToken = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, cancellationToken);
        if (card is null || card.UserId != userId)
        {
            throw new AiCardNotFoundException(cardId);
        }

        var link = await _channelRepo.GetByIdForUpdateAsync(linkId, cancellationToken);
        if (link is null || link.AiCardId != cardId)
        {
            throw new ChannelLinkNotFoundException();
        }

        await _channelRepo.DeleteAsync(linkId, cancellationToken);

        _logger.LogInformation(
            "User {UserId} removed channel link {LinkId} from card {CardId}",
            userId,
            linkId,
            cardId);
    }

    public async Task<ChannelLink> PatchAsync(
        Guid userId,
        Guid cardId,
        Guid linkId,
        PatchChannelLinkCommand command,
        CancellationToken cancellationToken = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, cancellationToken);
        if (card is null || card.UserId != userId)
        {
            throw new AiCardNotFoundException(cardId);
        }

        var link = await _channelRepo.GetByIdForUpdateAsync(linkId, cancellationToken);
        if (link is null || link.AiCardId != cardId)
        {
            throw new ChannelLinkNotFoundException();
        }

        link.IsActive = command.IsActive;
        await _channelRepo.UpdateAsync(link, cancellationToken);

        return ToDto(link);
    }


    public async Task UpsertDiscordChannelAsync(
        Guid userId,
        Guid cardId,
        string guildId,
        string guildName,
        string accessTokenEnc,
        string refreshTokenEnc,
        DateTime tokenExpiresAt,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct);
        if (card is null || card.UserId != userId)
            throw new AiCardNotFoundException(cardId);

        var existing = await _channelRepo.GetByCardIdAsync(cardId, ct);
        var channel = existing.FirstOrDefault(c =>
            c.Platform == "discord" && c.ChannelId == guildId);

        var now = _time.GetUtcNow().UtcDateTime;

        if (channel is null)
        {
            channel = new AiCardChannel
            {
                Id             = IdGenerator.New(),
                AiCardId       = cardId,
                Platform       = "discord",
                ChannelId      = guildId,
                ChannelName    = guildName,
                BotUsername    = "Inktide",
                OAuthTokenEnc  = accessTokenEnc,
                RefreshTokenEnc = refreshTokenEnc,
                TokenExpiresAt = tokenExpiresAt,
                IsActive       = true,
                ConnectedAt    = now,
                CreatedAt      = now,
            };
            await _channelRepo.CreateAsync(channel, ct);
        }
        else
        {
            channel.ChannelName    = guildName;
            channel.OAuthTokenEnc  = accessTokenEnc;
            channel.RefreshTokenEnc = refreshTokenEnc;
            channel.TokenExpiresAt = tokenExpiresAt;
            channel.IsActive       = true;
            channel.ConnectedAt    = now;
            await _channelRepo.UpdateAsync(channel, ct);
        }
    }

    public async Task UpsertTwitchChannelAsync(
        Guid userId,
        Guid cardId,
        string channelLogin,
        string botUsername,
        string accessTokenEnc,
        string refreshTokenEnc,
        DateTime tokenExpiresAt,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct);
        if (card is null || card.UserId != userId)
            throw new AiCardNotFoundException(cardId);

        var existing = await _channelRepo.GetByCardIdAsync(cardId, ct);
        var channel  = existing.FirstOrDefault(c =>
            c.Platform == "twitch" && c.ChannelId == channelLogin);

        var now = _time.GetUtcNow().UtcDateTime;

        if (channel is null)
        {
            channel = new AiCardChannel
            {
                Id              = IdGenerator.New(),
                AiCardId        = cardId,
                Platform        = "twitch",
                ChannelId       = channelLogin,
                ChannelName     = channelLogin,
                BotUsername     = botUsername,
                OAuthTokenEnc   = accessTokenEnc,
                RefreshTokenEnc = refreshTokenEnc,
                TokenExpiresAt  = tokenExpiresAt,
                IsActive        = true,
                ConnectedAt     = now,
                CreatedAt       = now,
            };
            await _channelRepo.CreateAsync(channel, ct);
        }
        else
        {
            channel.BotUsername     = botUsername;
            channel.OAuthTokenEnc   = accessTokenEnc;
            channel.RefreshTokenEnc = refreshTokenEnc;
            channel.TokenExpiresAt  = tokenExpiresAt;
            channel.IsActive        = true;
            channel.ConnectedAt     = now;
            await _channelRepo.UpdateAsync(channel, ct);
        }
    }

    public async Task<Guid> UpsertTelegramChannelAsync(
        Guid userId,
        Guid cardId,
        string chatId,
        string chatName,
        string encryptedBotToken,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct);
        if (card is null || card.UserId != userId)
            throw new AiCardNotFoundException(cardId);

        var existing = await _channelRepo.GetByCardIdAsync(cardId, ct);
        var channel = existing.FirstOrDefault(c =>
            c.Platform == "telegram" && c.ChannelId == chatId);

        var now = _time.GetUtcNow().UtcDateTime;

        if (channel is null)
        {
            channel = new AiCardChannel
            {
                Id            = IdGenerator.New(),
                AiCardId      = cardId,
                Platform      = "telegram",
                ChannelId     = chatId,
                ChannelName   = chatName,
                BotUsername   = "TelegramBot",
                OAuthTokenEnc = encryptedBotToken,
                IsActive      = true,
                ConnectedAt   = now,
                CreatedAt     = now,
            };
            await _channelRepo.CreateAsync(channel, ct);
        }
        else
        {
            channel.ChannelName   = chatName;
            channel.OAuthTokenEnc = encryptedBotToken;
            channel.IsActive      = true;
            channel.ConnectedAt   = now;
            await _channelRepo.UpdateAsync(channel, ct);
        }

        return channel.Id;
    }

    public async Task<AiCardChannel?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default)
    {
        var channel = await _channelRepo.GetByIdForUpdateAsync(channelId, ct);
        if (channel is null) return null;

        var card = await _cardRepo.GetByIdAsync(channel.AiCardId, ct);
        if (card is null || card.UserId != userId) return null;

        return channel;
    }

    public async Task DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default)
    {
        var channel = await _channelRepo.GetByIdForUpdateAsync(channelId, ct);
        if (channel is null) return;

        var card = await _cardRepo.GetByIdAsync(channel.AiCardId, ct);
        if (card is null || card.UserId != userId) return;

        channel.IsActive       = false;
        channel.OAuthTokenEnc  = null;
        channel.RefreshTokenEnc = null;
        channel.TokenExpiresAt = null;
        await _channelRepo.UpdateAsync(channel, ct);
    }

    public async Task SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default)
    {
        var channel = await _channelRepo.GetByIdForUpdateAsync(channelId, ct);
        if (channel is null) return;

        var card = await _cardRepo.GetByIdAsync(channel.AiCardId, ct);
        if (card is null || card.UserId != userId) return;

        channel.CustomBotTokenEnc = encryptedToken;
        await _channelRepo.UpdateAsync(channel, ct);
    }

    private static ChannelLink ToDto(AiCardChannel c) =>
        new(
            c.Id,
            c.Platform,
            c.ChannelName,
            c.ChannelId,
            c.BotUsername,
            c.IsActive,
            c.ConnectedAt,
            c.CustomBotTokenEnc is not null);

}
