using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Passes the Twitch chat message context downstream.
/// Applies bits_only / subs_only filters from node config.
/// The actual Twitch IRC connectivity lives in Inktide.API.Connector (future).
/// </summary>
public sealed class TwitchInputNodeHandler : INodeHandler
{
    public string Type => "input";
    public string ProviderId => "twitch";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var bitsOnly = context.GetConfig<bool?>("bits_only") ?? false;
        var subsOnly = context.GetConfig<bool?>("subs_only") ?? false;

        if (bitsOnly)
        {
            var isBitsMessage = context.GetInput<bool?>("is_bits") ?? false;
            if (!isBitsMessage) return Task.CompletedTask;
        }

        if (subsOnly)
        {
            var isSubscriber = context.GetInput<bool?>("is_subscriber") ?? false;
            if (!isSubscriber) return Task.CompletedTask;
        }

        foreach (var kv in context.Inputs)
            context.SetOutput(kv.Key, kv.Value);

        return Task.CompletedTask;
    }
}
