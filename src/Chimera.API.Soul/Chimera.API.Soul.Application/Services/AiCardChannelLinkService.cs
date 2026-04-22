using Chimera.API.Soul.Application.Exceptions;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Application.Models;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Application.Services;

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
            Id = Guid.NewGuid(),
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


    private static ChannelLink ToDto(AiCardChannel c) =>
        new(
            c.Id,
            c.Platform,
            c.ChannelName,
            c.ChannelId,
            c.BotUsername,
            c.IsActive,
            c.ConnectedAt);

}
