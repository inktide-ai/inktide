using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Application.Models;
using Microsoft.Extensions.Logging;
using TwitchLib.Client.Events;

namespace Inktide.API.Connector.Twitch.Gateway;

internal sealed class TwitchMessageHandler
{
    private readonly ITwitchChannelRegistry _registry;
    private readonly IStreamMessageHandler _messageHandler;
    private readonly ILogger<TwitchMessageHandler> _logger;

    public TwitchMessageHandler(
        ITwitchChannelRegistry registry,
        IStreamMessageHandler messageHandler,
        ILogger<TwitchMessageHandler> logger)
    {
        _registry       = registry       ?? throw new ArgumentNullException(nameof(registry));
        _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(OnMessageReceivedArgs args)
    {
        var msg          = args.ChatMessage;
        var channelLogin = msg.Channel.ToLowerInvariant();

        var cardId = _registry.Resolve(channelLogin);
        if (cardId is null)
        {
            _logger.LogDebug("Twitch: no soul mapping for channel #{Channel} — message dropped", channelLogin);
            return;
        }

        var badges = msg.Badges
            .Select(b => b.Key)
            .ToList();

        var sender = new UserMetadata(
            UserId:      msg.UserId,
            UserName:    msg.Username,
            Badges:      badges,
            IsModerator:  msg.UserDetail.IsModerator,
            IsSubscriber: msg.UserDetail.IsSubscriber,
            IsVip:        msg.UserDetail.IsVip,
            IsBroadcaster: msg.IsBroadcaster,
            Color:       string.IsNullOrEmpty(msg.HexColor) ? null : msg.HexColor);

        var chatMessage = new ChatMessage(
            PlatformId:  TwitchConnector.PlatformIdValue,
            ChannelId:   channelLogin,
            ChannelName: channelLogin,
            Sender:      sender,
            Text:        msg.Message,
            Timestamp:   DateTimeOffset.UtcNow)
        {
            CharacterId = cardId.Value,
        };

        try
        {
            await _messageHandler.HandleAsync(chatMessage).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Twitch: error handling message from #{Channel}", channelLogin);
        }
    }
}
