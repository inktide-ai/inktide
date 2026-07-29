using Inktide.API.Connector.Application.Models;
using TwitchLib.Client.Events;

namespace Inktide.API.Connector.Twitch.Gateway;

/// <summary>
/// Maps a raw TwitchLib message event to the unified <see cref="ChatMessage"/> model.
/// Mirrors <c>DiscordMessageMapper</c> - keeps mapping logic separate from routing logic.
/// </summary>
internal sealed class TwitchMessageMapper : ITwitchMessageMapper
{
    public ChatMessage Map(OnMessageReceivedArgs args, string channelLogin, Guid cardId)
    {
        var msg = args.ChatMessage;

        var badges = msg.Badges
            .Select(b => b.Key)
            .ToList();

        var sender = new UserMetadata(
            UserId:        msg.UserId,
            UserName:      msg.Username,
            Badges:        badges,
            IsModerator:   msg.UserDetail.IsModerator,
            IsSubscriber:  msg.UserDetail.IsSubscriber,
            IsVip:         msg.UserDetail.IsVip,
            IsBroadcaster: msg.IsBroadcaster,
            Color:         string.IsNullOrEmpty(msg.HexColor) ? null : msg.HexColor);

        return new ChatMessage(
            PlatformId:  TwitchConnector.PlatformIdValue,
            ChannelId:   channelLogin,
            ChannelName: channelLogin,
            Sender:      sender,
            Text:        msg.Message,
            Timestamp:   DateTimeOffset.UtcNow)
        {
            CharacterId = cardId,
        };
    }
}
