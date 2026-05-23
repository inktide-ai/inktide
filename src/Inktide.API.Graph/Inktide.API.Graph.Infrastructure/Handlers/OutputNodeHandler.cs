using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Terminal node — logs the final output and marks pipeline completion.
/// Concrete delivery (audio stream, browser, Discord) is added per channel_target.
/// </summary>
public sealed class OutputNodeHandler : INodeHandler
{
    public string Type => "output";
    public string ProviderId => "core";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetService<ILogger<OutputNodeHandler>>();
        var channelTarget = context.GetConfig<string>("channel_target") ?? "browser";
        logger?.LogDebug("OutputNode: delivering to channel_target={Target}", channelTarget);
        return Task.CompletedTask;
    }
}
