using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.Discord.Settings;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chimera.API.Connector.Discord;

/// <summary>
/// Discord chat connector via Gateway WebSocket (Discord.Net).
/// Receives MESSAGE_CREATE events in real time and delegates to <see cref="IStreamMessageHandler"/>.
/// </summary>
public sealed class DiscordConnector : IChatConnector, IAsyncDisposable
{
    public const string PlatformIdValue = "discord";

    public string PlatformId => PlatformIdValue;
    public bool IsConnected => _client.ConnectionState == ConnectionState.Connected;

    private readonly ILogger<DiscordConnector> _logger;
    private readonly DiscordSocketClient _client;
    private readonly DiscordSettings _settings;
    private readonly IStreamMessageHandler _messageHandler;
    private readonly DiscordMessageMapper _mapper;

    private CancellationTokenSource? _cts;
    private TaskCompletionSource _readyTcs = new();

    public DiscordConnector(
        ILogger<DiscordConnector> logger,
        IOptions<DiscordSettings> settings,
        IStreamMessageHandler messageHandler,
        DiscordMessageMapper mapper)
    {
        _logger = logger;
        _settings = settings.Value;
        _messageHandler = messageHandler;
        _mapper = mapper;

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
        _client.MessageReceived += OnMessageReceived;
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

    public async ValueTask DisposeAsync()
    {
        _client.Log -= OnLog;
        _client.Ready -= OnReady;
        _client.Disconnected -= OnDisconnected;
        _client.MessageReceived -= OnMessageReceived;

        if (_client.ConnectionState == ConnectionState.Connected) {
            await DisconnectAsync();
        }

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
        {
            _logger.LogInformation("Gateway disconnected (shutdown)");
        }
        else
        {
            _logger.LogWarning(
                "Gateway disconnected. Discord.Net will auto-reconnect. {Error}",
                ex?.Message ?? "Unknown");
        }
        return Task.CompletedTask;
    }

    private async Task OnMessageReceived(SocketMessage rawMessage)
    {
        if (rawMessage is not SocketUserMessage message) {
            return;
        }

        if (message.Author.IsBot && _settings.IgnoreBots) {
            return;
        }

        if (message.Channel is not SocketTextChannel textChannel) {
            return;
        }

        if (_settings.GuildIds.Count > 0 && !_settings.GuildIds.Contains(textChannel.Guild.Id)) {
            return;
        }

        if (_settings.ChannelIds.Count > 0 && !_settings.ChannelIds.Contains(textChannel.Id)) {
            return;
        }

        try
        {
            var chatMessage = _mapper.Map(message, textChannel.Name, textChannel.Guild.Id.ToString());
            await _messageHandler.HandleAsync(chatMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle Discord message from {Author}", message.Author.Username);
        }
    }

    private Task OnLog(LogMessage log)
    {
        if (log.Exception is TaskCanceledException or OperationCanceledException)
        {
            _logger.LogDebug("{Message} (shutdown)", log.Message);
            return Task.CompletedTask;
        }

        var level = log.Severity switch
        {
            LogSeverity.Critical => LogLevel.Critical,
            LogSeverity.Error => LogLevel.Error,
            LogSeverity.Warning => LogLevel.Warning,
            LogSeverity.Info => LogLevel.Information,
            LogSeverity.Verbose => LogLevel.Debug,
            LogSeverity.Debug => LogLevel.Trace,
            _ => LogLevel.Information
        };

        var msg = log.Exception is not null
            ? $"{log.Message}. {log.Exception.GetType().Name}: {log.Exception.Message}"
            : $"{log.Message}";
        _logger.Log(level, msg);
        return Task.CompletedTask;
    }
}
