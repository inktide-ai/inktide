using Chimera.API.Connector.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Chimera.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Manages a singleton RabbitMQ connection and ensures exchange/queue topology exists.
/// Thread-safe: all access to connection and channel is protected by a SemaphoreSlim.
/// </summary>
public sealed class RabbitMqConnectionProvider : IRabbitMqChannelProvider
{
    #region Fields

    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqConnectionProvider> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private IConnection? _connection;
    private IChannel? _channel;

    #endregion

    #region Constructors

    public RabbitMqConnectionProvider(
        IOptions<RabbitMqSettings> settings,
        ILogger<RabbitMqConnectionProvider> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    #endregion

    #region Properties

    public bool IsConnected => _connection is { IsOpen: true };

    #endregion

    #region Public Methods

    /// <inheritdoc/>
    public async Task<IChannel> GetChannelAsync(CancellationToken ct = default)
    {
        // Always acquire the lock — eliminates the TOCTOU race between the pre-check
        // and channel use that existed with the previous double-checked pattern.
        await _lock.WaitAsync(ct);
        try
        {
            if (_channel is { IsOpen: true })
            {
                return _channel;
            }

            if (_connection is not { IsOpen: true })
            {
                var factory = new ConnectionFactory
                {
                    HostName = _settings.Host,
                    Port = _settings.Port,
                    UserName = _settings.Username,
                    Password = _settings.Password,
                    VirtualHost = _settings.VirtualHost
                };

                _connection = await factory.CreateConnectionAsync(ct);
                _logger.LogInformation(
                    "RabbitMQ connected. Host={Host}:{Port} VHost={VHost}",
                    _settings.Host, _settings.Port, _settings.VirtualHost);
            }

            _channel = await _connection.CreateChannelAsync(cancellationToken: ct);

            await _channel.ExchangeDeclareAsync(
                exchange: _settings.Exchange,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false,
                cancellationToken: ct);

            await _channel.QueueDeclareAsync(
                queue: _settings.QueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                cancellationToken: ct);

            await _channel.QueueBindAsync(
                queue: _settings.QueueName,
                exchange: _settings.Exchange,
                routingKey: _settings.RoutingKey,
                cancellationToken: ct);

            _logger.LogInformation(
                "RabbitMQ topology ready. Exchange={Exchange} Queue={Queue} RoutingKey={RoutingKey}",
                _settings.Exchange, _settings.QueueName, _settings.RoutingKey);

            return _channel;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.CloseAsync();
            _channel.Dispose();
        }

        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection.Dispose();
        }
    }

    #endregion
}
