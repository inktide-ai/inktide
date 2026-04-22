using System.Threading.Channels;
using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.Application.Interfaces;
using Chimera.API.Connector.Application.Models;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Connector.ChimeraChat;

/// <summary>
/// Browser-based chat connector. Implements <see cref="IChimeraChatInbox"/> so that
/// the REST controller can enqueue messages, and <see cref="IChatConnector"/> so that
/// the hosting infrastructure starts/stops it alongside Discord/Twitch connectors.
///
/// <para>Channel ID convention: <c>"{cardId}:{userId}"</c>.
/// The composite key ensures per-user SignalR group isolation in a SaaS context.</para>
/// </summary>
public sealed class ChimeraChatConnector : IChatConnector, IChimeraChatInbox, IAsyncDisposable
{
    public const string PlatformIdValue = "chimera-chat";

    public string PlatformId => PlatformIdValue;

    // Worker being non-null and not yet completed is the reliable proxy for "running",
    // since this connector has no external socket whose state we can poll.
    public bool IsConnected => _worker is { IsCompleted: false };

    private readonly IStreamMessageHandler _handler;
    private readonly ILogger<ChimeraChatConnector> _logger;
    private readonly Channel<InboundMessage> _queue;

    private CancellationTokenSource? _cts;
    private Task? _worker;

    private readonly record struct InboundMessage(
        string ChannelId,
        string UserId,
        string UserName,
        string Text,
        DateTimeOffset Timestamp);

    public ChimeraChatConnector(
        IStreamMessageHandler handler,
        ILogger<ChimeraChatConnector> logger)
    {
        _handler = handler ?? throw new ArgumentNullException(nameof(handler));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // DropWrite: TryWrite returns false when the buffer is full, giving callers an accurate
        // backpressure signal. DropNewest/DropOldest silently evict items inside the channel and
        // always return true from TryWrite, making the 429 path in the controller unreachable.
        _queue = Channel.CreateBounded<InboundMessage>(new BoundedChannelOptions(500)
        {
            FullMode = BoundedChannelFullMode.DropWrite,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public bool TryEnqueue(string channelId, string userId, string userName, string text)
    {
        // Timestamp here, not at dequeue: downstream sees actual arrival time, not when the consumer loop picked it up.
        var msg = new InboundMessage(channelId, userId, userName, text, DateTimeOffset.UtcNow);

        if (_queue.Writer.TryWrite(msg))
            return true;

        _logger.LogWarning(
            "[ChimeraChat] Inbox buffer full — dropping message. Channel={ChannelId} User={UserId}",
            channelId, userId);
        return false;
    }

    public Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (_worker is not null)
        {
            _logger.LogWarning("[ChimeraChat] ConnectAsync called on an already-running connector — ignoring.");
            return Task.CompletedTask;
        }

        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _worker = Task.Run(() => ConsumeLoopAsync(_cts.Token), CancellationToken.None);

        _logger.LogInformation("[ChimeraChat] Connector started.");
        return Task.CompletedTask;
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[ChimeraChat] Connector stopping...");

        _queue.Writer.TryComplete();

        var cts = Interlocked.Exchange(ref _cts, null);
        if (cts is not null)
        {
            await cts.CancelAsync();
            cts.Dispose();
        }

        if (_worker is not null)
        {
            try
            {
                await _worker.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("[ChimeraChat] Consumer worker did not stop within 5 s.");
            }
            catch (OperationCanceledException) { }

            _worker = null;
        }

        _logger.LogInformation("[ChimeraChat] Connector stopped.");
    }

    private async Task ConsumeLoopAsync(CancellationToken ct)
    {
        try
        {
            await foreach (var msg in _queue.Reader.ReadAllAsync(ct))
            {
                try
                {
                    var chatMessage = new ChatMessage(
                        PlatformId:  PlatformIdValue,
                        ChannelId:   msg.ChannelId,
                        ChannelName: "chimera-chat",
                        Sender: new UserMetadata(
                            UserId:        msg.UserId,
                            UserName:      msg.UserName,
                            Badges:        [],
                            IsModerator:   false,
                            IsSubscriber:  false,
                            IsVip:         false,
                            IsBroadcaster: false),
                        Text:      msg.Text,
                        Timestamp: msg.Timestamp);

                    await _handler.HandleAsync(chatMessage);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "[ChimeraChat] Failed to handle message from {User}", msg.UserName);
                }
            }
        }
        catch (OperationCanceledException) { }

        _logger.LogDebug("[ChimeraChat] Consumer loop exited.");
    }

    public ValueTask DisposeAsync() => new(DisconnectAsync());
}
