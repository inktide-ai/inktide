using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TwitchLib.Api;
using TwitchLib.Api.Core.Enums;
using TwitchLib.EventSub.Core.EventArgs.Channel;
using TwitchLib.EventSub.Websockets;
using TwitchLib.EventSub.Websockets.Core.EventArgs;
using Chimera.ApiGateway.Application.Contracts.Streaming;
using Chimera.ApiGateway.Twitch.Auth;
using Chimera.ApiGateway.Twitch.Settings;

namespace Chimera.ApiGateway.Twitch;

/// <summary>
/// Twitch chat connector via EventSub WebSocket.
/// Manages connection lifecycle, automatic reconnection with exponential backoff,
/// and delegates message mapping to <see cref="TwitchMessageMapper"/>.
/// </summary>
public sealed class TwitchConnector : IChatConnector, IAsyncDisposable
{
    public const string PlatformIdValue = "twitch";

    public string PlatformId => PlatformIdValue;
    public bool IsConnected => _connected;

    private readonly ILogger<TwitchConnector> _logger;
    private readonly EventSubWebsocketClient _eventSubClient;
    private readonly ITwitchTokenProvider _tokenProvider;
    private readonly TwitchSettings _settings;
    private readonly IStreamMessageHandler _messageHandler;
    private readonly TwitchMessageMapper _mapper;

    private volatile bool _connected;
    private CancellationTokenSource? _cts;

    public TwitchConnector(
        ILogger<TwitchConnector> logger,
        EventSubWebsocketClient eventSubClient,
        IOptions<TwitchSettings> settings,
        ITwitchTokenProvider tokenProvider,
        IStreamMessageHandler messageHandler,
        TwitchMessageMapper mapper)
    {
        _logger = logger;
        _eventSubClient = eventSubClient;
        _settings = settings.Value;
        _tokenProvider = tokenProvider;
        _messageHandler = messageHandler;
        _mapper = mapper;

        _eventSubClient.WebsocketConnected += OnWebsocketConnected;
        _eventSubClient.WebsocketDisconnected += OnWebsocketDisconnected;
        _eventSubClient.WebsocketReconnected += OnWebsocketReconnected;
        _eventSubClient.ErrorOccurred += OnErrorOccurred;
        _eventSubClient.ChannelChatMessage += OnChannelChatMessage;
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        _logger.LogInformation("Twitch connector starting...");
        await _eventSubClient.ConnectAsync();
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Twitch connector stopping...");

        if (_cts is not null)
        {
            await _cts.CancelAsync();
            _cts.Dispose();
            _cts = null;
        }

        _connected = false;
        await _eventSubClient.DisconnectAsync();
    }

    public async ValueTask DisposeAsync()
    {
        _eventSubClient.WebsocketConnected -= OnWebsocketConnected;
        _eventSubClient.WebsocketDisconnected -= OnWebsocketDisconnected;
        _eventSubClient.WebsocketReconnected -= OnWebsocketReconnected;
        _eventSubClient.ErrorOccurred -= OnErrorOccurred;
        _eventSubClient.ChannelChatMessage -= OnChannelChatMessage;

        if (_connected) {
            await DisconnectAsync();
        }

        _cts?.Dispose();
    }

    private async Task OnWebsocketConnected(object? sender, WebsocketConnectedArgs e)
    {
        _connected = true;

        _logger.LogInformation(
            "Twitch EventSub WebSocket connected. SessionId: {SessionId}",
            _eventSubClient.SessionId);

        if (e.IsRequestedReconnect) {
            return;
        }

        await SubscribeToChatMessagesAsync();
    }

    private async Task SubscribeToChatMessagesAsync()
    {
        var accessToken = await _tokenProvider.GetAccessTokenAsync(_cts?.Token ?? CancellationToken.None);

        var api = new TwitchAPI();
        api.Settings.ClientId = _settings.ClientId;
        api.Settings.AccessToken = accessToken;

        var broadcasterId = _settings.BroadcasterUserId;
        var userId = string.IsNullOrEmpty(_settings.UserId) ? broadcasterId : _settings.UserId;

        var condition = new Dictionary<string, string>
        {
            ["broadcaster_user_id"] = broadcasterId,
            ["user_id"] = userId
        };

        await api.Helix.EventSub.CreateEventSubSubscriptionAsync(
            "channel.chat.message",
            "1",
            condition,
            EventSubTransportMethod.Websocket,
            _eventSubClient.SessionId!);

        _logger.LogInformation(
            "Subscribed to channel.chat.message for broadcaster {BroadcasterUserId}",
            broadcasterId);
    }

    private async Task OnWebsocketDisconnected(object? sender, WebsocketDisconnectedArgs e)
    {
        _connected = false;
        _logger.LogWarning(
            "Twitch EventSub WebSocket disconnected. SessionId: {SessionId}",
            _eventSubClient.SessionId);

        await ReconnectWithBackoffAsync();
    }

    private async Task ReconnectWithBackoffAsync()
    {
        var ct = _cts?.Token ?? CancellationToken.None;
        var delay = TimeSpan.FromMilliseconds(_settings.ReconnectBaseDelayMs);
        var maxAttempts = _settings.MaxReconnectAttempts;

        for (var attempt = 1; maxAttempts == 0 || attempt <= maxAttempts; attempt++)
        {
            if (ct.IsCancellationRequested)
            {
                _logger.LogInformation("Twitch reconnect cancelled (shutdown requested)");
                return;
            }

            try
            {
                if (await _eventSubClient.ReconnectAsync())
                {
                    _logger.LogInformation("Twitch EventSub reconnected after {Attempt} attempt(s)", attempt);
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Twitch reconnect attempt {Attempt} threw an exception", attempt);
            }

            _logger.LogWarning(
                "Twitch reconnect attempt {Attempt} failed. Retrying in {Delay}ms...",
                attempt, (int)delay.TotalMilliseconds);

            try
            {
                await Task.Delay(delay, ct);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            delay = TimeSpan.FromMilliseconds(Math.Min(delay.TotalMilliseconds * 2, 60_000));
        }

        _logger.LogError(
            "Twitch EventSub reconnect failed after {MaxAttempts} attempts. Giving up",
            maxAttempts);
    }

    private Task OnWebsocketReconnected(object? sender, WebsocketReconnectedArgs e)
    {
        _connected = true;
        _logger.LogInformation(
            "Twitch EventSub WebSocket reconnected. SessionId: {SessionId}",
            _eventSubClient.SessionId);
        return Task.CompletedTask;
    }

    private Task OnErrorOccurred(object? sender, ErrorOccuredArgs e)
    {
        _logger.LogError(e.Exception,
            "Twitch EventSub error. SessionId: {SessionId}",
            _eventSubClient.SessionId);
        return Task.CompletedTask;
    }

    private async Task OnChannelChatMessage(object? _, ChannelChatMessageArgs e)
    {
        try
        {
            var message = _mapper.Map(e);
            await _messageHandler.HandleAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle Twitch chat message");
        }
    }
}
