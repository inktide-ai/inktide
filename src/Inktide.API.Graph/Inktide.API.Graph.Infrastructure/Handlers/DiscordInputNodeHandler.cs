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
    public string Type => "input";
    public string ProviderId => "discord";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var channelId = context.GetConfig<string>("channel_id");
        var incomingChannel = context.GetInput<string>("channel_id");

        // If channel_id is configured and doesn't match, skip processing.
        if (!string.IsNullOrEmpty(channelId) && !string.IsNullOrEmpty(incomingChannel)
            && !string.Equals(channelId, incomingChannel, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        foreach (var kv in context.Inputs)
            context.SetOutput(kv.Key, kv.Value);

        return Task.CompletedTask;
    }
}
