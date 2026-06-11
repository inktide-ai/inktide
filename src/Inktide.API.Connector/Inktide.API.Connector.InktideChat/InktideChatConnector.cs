using System.Threading.Channels;
using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.InktideChat;

/// <summary>
/// Browser-based chat connector. Implements <see cref="IInktideChatInbox"/> so that
/// the REST controller can enqueue messages, and <see cref="IChatConnector"/> so that
/// the hosting infrastructure starts/stops it alongside Discord/Twitch connectors.
///
/// <para>Channel ID convention: <c>"{cardId}:{userId}"</c>.
/// The composite key ensures per-user SignalR group isolation in a SaaS context.</para>
/// </summary>
public sealed class InktideChatConnector : IChatConnector, IInktideChatInbox, IAsyncDisposable
{
    public const string PlatformIdValue   = "inktide-chat";
    // Distinct from PlatformIdValue: channel label visible in downstream routing/logs.
    // Same value today, but independently modifiable without touching the platform ID.
    internal const string DefaultChannelName = "inktide-chat";

    public string PlatformId => PlatformIdValue;

    // Worker being non-null and not yet completed is the reliable proxy for "running",
    // since this connector has no external socket whose state we can poll.
    public bool IsConnected => _worker is { IsCompleted: false };

    private readonly IStreamMessageHandler _handler;
    private readonly IInktideChatMessageMapper _mapper;
    private readonly ILogger<InktideChatConnector> _logger;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly Channel<InboundMessage> _queue;

    private CancellationTokenSource? _cts;
    private Task? _worker;

    public readonly record struct InboundMessage(
        string ChannelId,
        string UserId,
        string UserName,
        string Text,
        DateTimeOffset Timestamp);

    public InktideChatConnector(
        IStreamMessageHandler handler,
        IInktideChatMessageMapper mapper,
        ILogger<InktideChatConnector> logger,
        IHostApplicationLifetime lifetime)
    {
        _handler  = handler  ?? throw new ArgumentNullException(nameof(handler));
        _mapper   = mapper   ?? throw new ArgumentNullException(nameof(mapper));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
        _lifetime = lifetime ?? throw new ArgumentNullException(nameof(lifetime));

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
            "[InktideChat] Inbox buffer full — dropping message. Channel={ChannelId} User={UserId}",
            channelId, userId);
        return false;
    }

    public Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (_worker is not null)
        {
            _logger.LogWarning("[InktideChat] ConnectAsync called on an already-running connector — ignoring.");
            return Task.CompletedTask;
        }

        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _lifetime.ApplicationStopping);
        // Capture token by value before Task.Run to prevent NullReferenceException if DisconnectAsync
        // nulls out _cts before the thread-pool thread executes the lambda.
        var token = _cts.Token;
        _worker = Task.Run(() => ConsumeLoopAsync(token), CancellationToken.None);

        _logger.LogInformation("[InktideChat] Connector started.");
        return Task.CompletedTask;
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[InktideChat] Connector stopping...");

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
                _logger.LogWarning("[InktideChat] Consumer worker did not stop within 5 s.");
            }
            catch (OperationCanceledException) { }

            _worker = null;
        }

        _logger.LogInformation("[InktideChat] Connector stopped.");
    }

    private async Task ConsumeLoopAsync(CancellationToken ct)
    {
        try
        {
            await foreach (var msg in _queue.Reader.ReadAllAsync(ct))
            {
                try
                {
                    var chatMessage = _mapper.Map(msg);
                    await _handler.HandleAsync(chatMessage);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "[InktideChat] Failed to handle message from {User}", msg.UserName);
                }
            }
        }
        catch (OperationCanceledException) { }

        _logger.LogDebug("[InktideChat] Consumer loop exited.");
    }

    public ValueTask DisposeAsync() => new(DisconnectAsync());
}
