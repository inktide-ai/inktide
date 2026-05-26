using Inktide.API.Connector.Application.Models;
using TwitchLib.Client.Events;

namespace Inktide.API.Connector.Twitch.Gateway;

internal interface ITwitchMessageMapper
{
    ChatMessage Map(OnMessageReceivedArgs args, string channelLogin, Guid cardId);
}
