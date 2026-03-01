using Microsoft.Extensions.Logging;
using Chimera.ApiGateway.Application.Contracts.Streaming;
using Chimera.ApiGateway.Application.Models.Streaming;

namespace Chimera.ApiGateway.Infrastructure.Messaging;

/// <summary>
/// Enqueues chat messages into the in-memory queue for async RabbitMQ publishing.
/// Non-blocking — connector event loops are never stalled by RabbitMQ I/O.
/// </summary>
public sealed class RabbitMqMessageHandler : IStreamMessageHandler
{
    #region Fields

    private readonly IChatMessageQueue _queue;
    private readonly ILogger<RabbitMqMessageHandler> _logger;

    #endregion

    #region Constructors

    public RabbitMqMessageHandler(IChatMessageQueue queue, ILogger<RabbitMqMessageHandler> logger)
    {
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public Task HandleAsync(ChatMessage message, CancellationToken cancellationToken = default)
    {
        if (_queue.TryEnqueue(message))
        {
            _logger.LogDebug(
                "[{Platform}] @{User} #{Channel}: enqueued",
                message.PlatformId, message.Sender.UserName, message.ChannelName);
        }
        else
        {
            _logger.LogWarning(
                "[{Platform}] @{User} #{Channel}: buffer full, message dropped",
                message.PlatformId, message.Sender.UserName, message.ChannelName);
        }

        return Task.CompletedTask;
    }

    #endregion
}
