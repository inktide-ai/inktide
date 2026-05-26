using Discord.WebSocket;

namespace Inktide.API.Connector.Discord;

internal interface IDiscordMessageHandler
{
    Task HandleAsync(SocketMessage rawMessage);
}
