using Discord.WebSocket;
using Chimera.ApiGateway.Application.Models.Streaming;

namespace Chimera.ApiGateway.Discord;

/// <summary>
/// Maps Discord <see cref="SocketMessage"/> to the unified <see cref="ChatMessage"/> model.
/// </summary>
public sealed class DiscordMessageMapper
{
    public ChatMessage Map(SocketUserMessage message, string channelName, string guildId)
    {
        var author = message.Author;
        var guildUser = author as SocketGuildUser;

        var roles = guildUser?.Roles
            .Where(r => !r.IsEveryone)
            .Select(r => r.Name)
            .ToList() ?? [];

        var isAdmin = guildUser?.GuildPermissions.Administrator == true;
        var isModerator = guildUser?.GuildPermissions.ManageMessages == true
                          || guildUser?.GuildPermissions.ModerateMembers == true;

        var sender = new UserMetadata(
            author.Id.ToString(),
            author.Username,
            roles,
            IsModerator: isModerator || isAdmin,
            IsSubscriber: guildUser?.PremiumSince is not null,
            IsVip: false,
            IsBroadcaster: guildUser?.Guild.OwnerId == author.Id,
            Color: null);

        return new ChatMessage(
            DiscordConnector.PlatformIdValue,
            guildId,
            channelName,
            sender,
            message.CleanContent,
            message.CreatedAt);
    }
}
