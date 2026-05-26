using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

public sealed class AiCardChannelLinkService :
    IAiCardChannelCrudService,
    IAiCardChannelLifecycleService,
    IAiCardChannelConnectService
{
    private readonly IAiCardRepository _cardRepo;
    private readonly IAiCardChannelRepository _channelRepo;
    private readonly IUserPlanResolver _planResolver;
    private readonly TimeProvider _time;
    private readonly ILogger<AiCardChannelLinkService> _logger;

    public AiCardChannelLinkService(
        IAiCardRepository cardRepo,
        IAiCardChannelRepository channelRepo,
        IUserPlanResolver planResolver,
        TimeProvider time,
        ILogger<AiCardChannelLinkService> logger)
    {
        _cardRepo     = cardRepo     ?? throw new ArgumentNullException(nameof(cardRepo));
        _channelRepo  = channelRepo  ?? throw new ArgumentNullException(nameof(channelRepo));
        _planResolver = planResolver ?? throw new ArgumentNullException(nameof(planResolver));
        _time         = time         ?? throw new ArgumentNullException(nameof(time));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    // ── IAiCardChannelCrudService ────────────────────────────────────────────

    public async Task<ChannelLink> CreateAsync(
        Guid userId,
        Guid cardId,
        CreateChannelLinkCommand command,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        await RequireCardOwnershipAsync(userId, cardId, ct);

        var platform = command.Platform.Trim().ToLowerInvariant();
        var channelName = command.ChannelName.Trim();
        var botUsername = command.BotUsername.Trim();
        var channelId = string.IsNullOrWhiteSpace(command.ChannelId) ? null : command.ChannelId.Trim();

        var existing = await _channelRepo.GetByCardIdAsync(cardId, ct);

        // ── Plan quota ──────────────────────────────────────────────────────────
        var limits = await _planResolver.GetLimitsAsync(userId.ToString(), ct).ConfigureAwait(false);
        if (existing.Count >= limits.MaxChannelsPerCard)
            throw new PlanLimitExceededException("channels_per_card", limits.MaxChannelsPerCard);

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

        await _channelRepo.CreateAsync(entity, ct);

        _logger.LogInformation(
            "User {UserId} linked card {CardId} to {Platform} channel {ChannelName}",
            userId, cardId, platform, channelName);

        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken ct = default)
    {
        await RequireCardOwnershipAsync(userId, cardId, ct);

        var link = await _channelRepo.GetByIdForUpdateAsync(linkId, ct);
        if (link is null || link.AiCardId != cardId)
            throw new ChannelLinkNotFoundException();

        await _channelRepo.DeleteAsync(linkId, ct);

        _logger.LogInformation(
            "User {UserId} removed channel link {LinkId} from card {CardId}",
            userId, linkId, cardId);
    }

    public async Task<ChannelLink> PatchAsync(
        Guid userId,
        Guid cardId,
        Guid linkId,
        PatchChannelLinkCommand command,
        CancellationToken ct = default)
    {
        await RequireCardOwnershipAsync(userId, cardId, ct);

        var link = await _channelRepo.GetByIdForUpdateAsync(linkId, ct);
        if (link is null || link.AiCardId != cardId)
            throw new ChannelLinkNotFoundException();

        link.IsActive = command.IsActive;
        await _channelRepo.UpdateAsync(link, ct);

        return ToDto(link);
    }

    // ── IAiCardChannelLifecycleService ───────────────────────────────────────

    public async Task<AiCardChannel?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default)
    {
        var owned = await TryGetOwnedChannelAsync(userId, channelId, ct);
        return owned?.channel;
    }

    public async Task<bool> DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default)
    {
        var owned = await TryGetOwnedChannelAsync(userId, channelId, ct);
        if (owned is null)
        {
            _logger.LogWarning("DeactivateAsync: channel {ChannelId} not found or not owned by user {UserId}", channelId, userId);
            return false;
        }

        var channel = owned.Value.channel;
        channel.IsActive = false;
        channel.OAuthTokenEnc = null;
        channel.RefreshTokenEnc = null;
        channel.TokenExpiresAt = null;
        await _channelRepo.UpdateAsync(channel, ct);
        return true;
    }

    public async Task<bool> SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default)
    {
        var owned = await TryGetOwnedChannelAsync(userId, channelId, ct);
        if (owned is null)
        {
            _logger.LogWarning("SetCustomBotTokenAsync: channel {ChannelId} not found or not owned by user {UserId}", channelId, userId);
            return false;
        }

        var channel = owned.Value.channel;
        channel.CustomBotTokenEnc = encryptedToken;
        await _channelRepo.UpdateAsync(channel, ct);
        return true;
    }

    // ── IAiCardChannelConnectService ─────────────────────────────────────────

    public async Task<Guid> UpsertAsync(OAuthChannelUpsertCommand cmd, CancellationToken ct = default)
    {
        await RequireCardOwnershipAsync(cmd.UserId, cmd.CardId, ct);

        var existing = await _channelRepo.GetByCardIdAsync(cmd.CardId, ct);
        var channel = existing.FirstOrDefault(c =>
            c.Platform == cmd.Platform && c.ChannelId == cmd.ChannelId);

        var now = _time.GetUtcNow().UtcDateTime;

        if (channel is null)
        {
            // ── Plan quota — only checked on new channel creation, not token refresh ──
            var limits = await _planResolver.GetLimitsAsync(cmd.UserId.ToString(), ct).ConfigureAwait(false);
            if (existing.Count >= limits.MaxChannelsPerCard)
                throw new PlanLimitExceededException("channels_per_card", limits.MaxChannelsPerCard);

            channel = new AiCardChannel
            {
                Id              = IdGenerator.New(),
                AiCardId        = cmd.CardId,
                Platform        = cmd.Platform,
                ChannelId       = cmd.ChannelId,
                ChannelName     = cmd.ChannelName,
                BotUsername     = cmd.BotUsername,
                OAuthTokenEnc   = cmd.AccessTokenEnc,
                RefreshTokenEnc = cmd.RefreshTokenEnc,
                TokenExpiresAt  = cmd.TokenExpiresAt,
                IsActive        = true,
                ConnectedAt     = now,
                CreatedAt       = now,
            };
            await _channelRepo.CreateAsync(channel, ct);
        }
        else
        {
            channel.ChannelName     = cmd.ChannelName;
            channel.BotUsername     = cmd.BotUsername;
            channel.OAuthTokenEnc   = cmd.AccessTokenEnc;
            channel.RefreshTokenEnc = cmd.RefreshTokenEnc;
            channel.TokenExpiresAt  = cmd.TokenExpiresAt;
            channel.IsActive        = true;
            channel.ConnectedAt     = now;
            await _channelRepo.UpdateAsync(channel, ct);
        }

        return channel.Id;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /// <summary>Throws AiCardNotFoundException when card is missing or owned by a different user.</summary>
    private async Task<AiCard> RequireCardOwnershipAsync(Guid userId, Guid cardId, CancellationToken ct)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct);
        if (card is null || card.UserId != userId)
            throw new AiCardNotFoundException(cardId);
        return card;
    }

    /// <summary>Returns null when channel is missing or its card is owned by a different user.</summary>
    private async Task<(AiCardChannel channel, AiCard card)?> TryGetOwnedChannelAsync(Guid userId, Guid channelId, CancellationToken ct)
    {
        var channel = await _channelRepo.GetByIdWithCardAsync(channelId, ct);
        if (channel is null || channel.AiCard is null || channel.AiCard.UserId != userId) return null;
        return (channel, channel.AiCard);
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
