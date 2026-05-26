using TwitchLib.Client.Events;

namespace Inktide.API.Connector.Twitch.Gateway;

internal interface ITwitchMessageHandler
{
    Task HandleAsync(OnMessageReceivedArgs args);
}
