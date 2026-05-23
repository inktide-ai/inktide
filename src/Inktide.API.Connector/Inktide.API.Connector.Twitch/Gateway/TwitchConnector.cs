using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Twitch.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TwitchLib.Client;
using TwitchLib.Client.Enums;
using TwitchLib.Client.Models;
using TwitchLib.Communication.Clients;
using TwitchLib.Communication.Enums;
using TwitchLib.Communication.Models;

namespace Inktide.API.Connector.Twitch.Gateway;

internal sealed class TwitchConnector : IChatConnector, ITwitchConnector, IAsyncDisposable
{
    public const string PlatformIdValue = "twitch";

    public string PlatformId  => PlatformIdValue;
    public bool   IsConnected => _client.IsConnected;

    private readonly TwitchClient _client;
    private readonly TwitchMessageHandler _messageHandler;
    private readonly ILogger<TwitchConnector> _logger;
    private CancellationTokenSource _cts = new();

    public TwitchConnector(
        IOptions<TwitchSettings> settings,
        TwitchMessageHandler messageHandler,
        ILoggerFactory loggerFactory,
        ILogger<TwitchConnector> logger)
    {
        _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));

        var s = settings?.Value ?? throw new ArgumentNullException(nameof(settings));

        // TwitchLib.Communication v2: automatic reconnect with exponential backoff 3s→3s, max 10 attempts
        var commOptions = new ClientOptions(
            new ReconnectionPolicy(reconnectInterval: 3000, maxAttempts: 10),
            useSsl: true,
            disconnectWait: 1500,
            clientType: ClientType.Chat);

        var webSocketClient = new WebSocketClient(commOptions, loggerFactory.CreateLogger<WebSocketClient>());

        // 750 messages per 30s burst — within Twitch moderator rate limits
        var sendOptions = new SendOptions(
            sendsAllowedInPeriod: 750,
            queueCapacity: 1000,
            cacheItemTimeoutInMinutes: 30,
            sendDelay: 0);

        _client = new TwitchClient(webSocketClient, ClientProtocol.WebSocket, sendOptions, loggerFactory);

        var credentials = new ConnectionCredentials(
            s.BotUsername,
            s.BotOAuthToken,
            disableUsernameCheck: false,
            new Capabilities(membership: true, tags: true, commands: true));
        _client.Initialize(credentials);

        _client.OnConnected       += async (_, _) => { OnConnected(); await Task.CompletedTask; };
        _client.OnDisconnected    += async (_, _) => { OnDisconnected(); await Task.CompletedTask; };
        _client.OnReconnected     += async (_, _) => { _logger.LogInformation("TwitchConnector: reconnected (twitch.irc.connected=1)"); await Task.CompletedTask; };
        _client.OnMessageReceived += async (_, args) => await _messageHandler.HandleAsync(args).ConfigureAwait(false);
        _client.OnError           += async (_, args) => { _logger.LogError(args.Exception, "TwitchClient error"); await Task.CompletedTask; };
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _logger.LogInformation("TwitchConnector: connecting...");
        await _client.ConnectAsync().ConfigureAwait(false);
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("TwitchConnector: disconnecting");
        _cts.Cancel();
        await _client.DisconnectAsync().ConfigureAwait(false);
    }

    public void JoinChannel(string channelLogin)
    {
        _ = _client.JoinChannelAsync(channelLogin.ToLowerInvariant(), false);
        _logger.LogInformation("TwitchConnector: joined channel #{Channel}", channelLogin);
    }

    public void LeaveChannel(string channelLogin)
    {
        _ = _client.LeaveChannelAsync(channelLogin.ToLowerInvariant());
        _logger.LogInformation("TwitchConnector: left channel #{Channel}", channelLogin);
    }

    private void OnConnected()
    {
        _logger.LogInformation("TwitchConnector: connected (twitch.irc.connected=1)");
    }

    private void OnDisconnected()
    {
        // TwitchLib.Communication handles reconnection automatically via ReconnectionPolicy
        _logger.LogWarning("TwitchConnector: disconnected (twitch.irc.connected=0)");
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        _cts.Dispose();
        await _client.DisconnectAsync().ConfigureAwait(false);
    }
}
