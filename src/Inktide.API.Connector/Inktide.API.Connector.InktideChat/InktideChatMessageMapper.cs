using Inktide.API.Connector.Application.Models;

namespace Inktide.API.Connector.InktideChat;

public sealed class InktideChatMessageMapper : IInktideChatMessageMapper
{
    public ChatMessage Map(InktideChatConnector.InboundMessage msg) =>
        new(
            PlatformId:  InktideChatConnector.PlatformIdValue,
            ChannelId:   msg.ChannelId,
            ChannelName: InktideChatConnector.DefaultChannelName,
            Sender: new UserMetadata(
                UserId:        msg.UserId,
                UserName:      msg.UserName,
                Badges:        [],
                IsModerator:   false,
                IsSubscriber:  false,
                IsVip:         false,
                IsBroadcaster: false),
            Text:      msg.Text,
            Timestamp: msg.Timestamp);
}
