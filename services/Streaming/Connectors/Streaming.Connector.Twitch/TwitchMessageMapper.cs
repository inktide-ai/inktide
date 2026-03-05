using TwitchLib.EventSub.Core.EventArgs.Channel;
using Chimera.ApiGateway.Application.Models.Streaming;

namespace Chimera.ApiGateway.Twitch;

/// <summary>
/// Maps Twitch EventSub ChannelChatMessage events to the unified <see cref="ChatMessage"/> model.
/// </summary>
public sealed class TwitchMessageMapper
{
    public ChatMessage Map(ChannelChatMessageArgs args)
    {
        var ev = args.Payload.Event;

        var badges = ev.Badges?.Select(b => b.SetId).ToList()
                     ?? new List<string>();

        var sender = new UserMetadata(
            ev.ChatterUserId,
            ev.ChatterUserName,
            badges,
            ev.IsModerator,
            ev.IsSubscriber,
            ev.IsVip,
            ev.IsBroadcaster,
            string.IsNullOrEmpty(ev.Color) ? null : ev.Color);

        return new ChatMessage(
            TwitchConnector.PlatformIdValue,
            ev.BroadcasterUserId,
            ev.BroadcasterUserName,
            sender,
            ev.Message.Text,
            DateTimeOffset.UtcNow);
    }
}
