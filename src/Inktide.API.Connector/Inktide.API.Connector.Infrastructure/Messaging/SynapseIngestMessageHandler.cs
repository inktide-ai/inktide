using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Enqueues chat messages into the in-memory queue for async Redis Stream (XADD) publishing.
/// Non-blocking — connector event loops are never stalled by Redis I/O.
/// </summary>
public sealed class SynapseIngestMessageHandler : IStreamMessageHandler
{

    private readonly IChatMessageQueue _queue;
    private readonly ILogger<SynapseIngestMessageHandler> _logger;


    public SynapseIngestMessageHandler(IChatMessageQueue queue, ILogger<SynapseIngestMessageHandler> logger)
    {
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


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

}
