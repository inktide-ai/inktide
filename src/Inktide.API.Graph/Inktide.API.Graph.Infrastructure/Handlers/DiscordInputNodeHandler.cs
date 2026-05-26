using Inktide.API.Graph.Domain;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Passes the Discord message context downstream.
/// Platform-specific filtering (guild_id, channel_id) is applied here;
/// the actual Discord connectivity lives in Inktide.API.Connector.Discord.
/// </summary>
public sealed class DiscordInputNodeHandler : INodeHandler
{
    public string Type => NodeTypes.Input;
    public string ProviderId => "discord";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var channelId         = context.GetConfig<string>(ConfigKeys.ChannelId);
        var incomingChannelId = context.GetInput<string>(ConfigKeys.ChannelId);

        if (!string.IsNullOrEmpty(channelId) && !string.IsNullOrEmpty(incomingChannelId)
            && !string.Equals(channelId, incomingChannelId, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        context.PassThrough();
        return Task.CompletedTask;
    }
}
