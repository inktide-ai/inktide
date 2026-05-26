using Inktide.API.Graph.Domain;
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
    public string Type => NodeTypes.Input;
    public string ProviderId => "telegram";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var commandsOnly = context.GetConfig<bool?>(ConfigKeys.CommandsOnly) ?? false;

        if (commandsOnly)
        {
            var text = context.GetInput<string>("text") ?? string.Empty;
            if (!text.StartsWith('/')) return Task.CompletedTask;
        }

        context.PassThrough();
        return Task.CompletedTask;
    }
}
