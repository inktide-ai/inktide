using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.Application.Interfaces;
using Chimera.API.Connector.Application.Models;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Enqueues chat messages into the in-memory queue for async Redis Stream (XADD) publishing.
/// Non-blocking — connector event loops are never stalled by Redis I/O.
/// </summary>
public sealed class SynapseIngestMessageHandler : IStreamMessageHandler
{
    #region Fields

    private readonly IChatMessageQueue _queue;
    private readonly ILogger<SynapseIngestMessageHandler> _logger;

    #endregion

    #region Constructors

    public SynapseIngestMessageHandler(IChatMessageQueue queue, ILogger<SynapseIngestMessageHandler> logger)
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
                "[{Platform}] @{User} #{Channel}: enqueued (synapse.ingest)",
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
