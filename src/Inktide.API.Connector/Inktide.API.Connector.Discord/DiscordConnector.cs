using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.Settings;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Discord;

internal sealed class DiscordConnector : IChatConnector, IAsyncDisposable
{
    public const string PlatformIdValue = "discord";

    public string PlatformId => PlatformIdValue;
    public bool IsConnected => _client.ConnectionState == ConnectionState.Connected;

    private readonly ILogger<DiscordConnector> _logger;
    private readonly DiscordSocketClient _client;
    private readonly DiscordSettings _settings;
    private readonly IDiscordMessageHandler _messageHandler;
    private readonly IGuildSoulRegistry _registry;

    private CancellationTokenSource? _cts;
    private TaskCompletionSource _readyTcs = new();

    public DiscordConnector(
        ILogger<DiscordConnector> logger,
        IOptions<DiscordSettings> settings,
        IDiscordMessageHandler messageHandler,
        IGuildSoulRegistry registry)
    {
        _logger         = logger ?? throw new ArgumentNullException(nameof(logger));
        _settings       = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
        _registry       = registry ?? throw new ArgumentNullException(nameof(registry));

        _client = new DiscordSocketClient(new DiscordSocketConfig
        {
            GatewayIntents = GatewayIntents.Guilds
                             | GatewayIntents.GuildMessages
                             | GatewayIntents.MessageContent,
            MessageCacheSize = 0,
            LogLevel = LogSeverity.Info
        });

        _client.Log += OnLog;
        _client.Ready += OnReady;
        _client.Disconnected += OnDisconnected;
        _client.MessageReceived += _messageHandler.HandleAsync;
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _readyTcs = new TaskCompletionSource();

        _logger.LogInformation("Discord connector starting...");

        await _client.LoginAsync(TokenType.Bot, _settings.BotToken);
        await _client.StartAsync();

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linkedCts.CancelAfter(TimeSpan.FromSeconds(30));

        try
        {
            await _readyTcs.Task.WaitAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Discord gateway did not become ready within 30s, continuing anyway");
        }
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Discord connector stopping...");

        if (_cts is not null)
        {
            await _cts.CancelAsync();
            _cts.Dispose();
            _cts = null;
        }

        await _client.StopAsync();
        await _client.LogoutAsync();
    }

    public Task JoinChannelAsync(string channelId, Guid cardId, CancellationToken ct = default)
    {
        _registry.Register(channelId, cardId);
        _logger.LogInformation("DiscordConnector: soul {CardId} registered for guild {GuildId}", cardId, channelId);
        return Task.CompletedTask;
    }

    public Task LeaveChannelAsync(string channelId, Guid cardId, CancellationToken ct = default)
    {
        _registry.Unregister(channelId);
        _logger.LogInformation("DiscordConnector: soul {CardId} unregistered from guild {GuildId}", cardId, channelId);
        return Task.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        _client.Log -= OnLog;
        _client.Ready -= OnReady;
        _client.Disconnected -= OnDisconnected;
        _client.MessageReceived -= _messageHandler.HandleAsync;

        if (_client.ConnectionState == ConnectionState.Connected)
            await DisconnectAsync();

        _cts?.Dispose();
        await _client.DisposeAsync();
    }

    private Task OnReady()
    {
        var guilds = _client.Guilds.Select(g => $"{g.Name} ({g.Id})");
        _logger.LogInformation(
            "Discord Gateway connected. Guilds: {Guilds}",
            string.Join(", ", guilds));

        _readyTcs.TrySetResult();
        return Task.CompletedTask;
    }

    private Task OnDisconnected(Exception? ex)
    {
        if (ex is TaskCanceledException or OperationCanceledException)
            _logger.LogInformation("Gateway disconnected (shutdown)");
        else
            _logger.LogWarning(
                "Gateway disconnected. Discord.Net will auto-reconnect. {Error}",
                ex?.Message ?? "Unknown");

        return Task.CompletedTask;
    }

    private Task OnLog(LogMessage log)
    {
        if (log.Exception is TaskCanceledException or OperationCanceledException)
        {
            _logger.LogDebug("{Source} {Message} (shutdown)", log.Source, log.Message);
            return Task.CompletedTask;
        }

        var level = DiscordLogLevelMapper.ToLogLevel(log.Severity);
        if (log.Exception is not null)
            _logger.Log(level, log.Exception, "[Discord] {Source} {Message}", log.Source, log.Message);
        else
            _logger.Log(level, "[Discord] {Source} {Message}", log.Source, log.Message);

        return Task.CompletedTask;
    }
}
