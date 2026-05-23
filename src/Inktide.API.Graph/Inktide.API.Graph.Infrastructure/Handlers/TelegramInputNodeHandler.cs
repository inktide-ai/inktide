using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Passes the Telegram message context downstream.
/// Applies commands_only filter from node config.
/// The actual Telegram Bot API connectivity is wired via Inktide.API.Connector (future).
/// </summary>
public sealed class TelegramInputNodeHandler : INodeHandler
{
    public string Type => "input";
    public string ProviderId => "telegram";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var commandsOnly = context.GetConfig<bool?>("commands_only") ?? false;

        if (commandsOnly)
        {
            var text = context.GetInput<string>("text") ?? string.Empty;
            if (!text.StartsWith('/')) return Task.CompletedTask;
        }

        foreach (var kv in context.Inputs)
            context.SetOutput(kv.Key, kv.Value);

        return Task.CompletedTask;
    }
}
