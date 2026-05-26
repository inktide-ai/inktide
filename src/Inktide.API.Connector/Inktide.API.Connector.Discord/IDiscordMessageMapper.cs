using Inktide.API.Connector.Application.Models;
using Discord.WebSocket;

namespace Inktide.API.Connector.Discord;

internal interface IDiscordMessageMapper
{
    ChatMessage Map(SocketUserMessage message, string channelName, string guildId);
}
