using Microsoft.Extensions.Logging;
using Chimera.AI.Orchestrator.Infrastructure.Models;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>
/// Default handler that logs consumed messages. Replace with real processing logic later.
/// </summary>
public sealed class LoggingChatMessageHandler : IChatMessageHandler
{
    private readonly ILogger<LoggingChatMessageHandler> _logger;

    public LoggingChatMessageHandler(ILogger<LoggingChatMessageHandler> logger)
    {
        _logger = logger;
    }

    public Task HandleAsync(ChatMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[{Platform}] #{Channel} @{User}: {Text}",
            message.PlatformId,
            message.ChannelName,
            message.Sender.UserName,
            message.Text);

        return Task.CompletedTask;
    }
}
