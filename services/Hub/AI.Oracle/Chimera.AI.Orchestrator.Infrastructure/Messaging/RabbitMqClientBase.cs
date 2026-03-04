using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>Base class for RabbitMQ clients. Manages connection, channel and topology.</summary>
public abstract class RabbitMqClientBase : IAsyncDisposable
{
    #region Fields

    private readonly RabbitMqSettings _settings;
    private readonly ILogger _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private IConnection? _connection;

    #endregion

    #region Properties

    protected IChannel? Channel { get; private set; }

    #endregion

    #region Constructors

    protected RabbitMqClientBase(
        IOptions<RabbitMqSettings> settings,
        ILogger logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    #endregion

    #region Protected Methods

    protected async Task ConnectToRabbitMqAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            if (_connection is null || !_connection.IsOpen)
            {
                var factory = new ConnectionFactory
                {
                    HostName = _settings.Host,
                    Port = _settings.Port,
                    UserName = _settings.Username,
                    Password = _settings.Password,
                    VirtualHost = _settings.VirtualHost,
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
                };

                _connection = await factory.CreateConnectionAsync(ct);
                _logger.LogInformation(
                    "RabbitMQ connected. Host={Host}:{Port} VHost={VHost}",
                    _settings.Host, _settings.Port, _settings.VirtualHost);
            }

            if (Channel is null || !Channel.IsOpen)
            {
                Channel = await _connection.CreateChannelAsync(cancellationToken: ct);

                await Channel.ExchangeDeclareAsync(
                    exchange: _settings.Exchange,
                    type: ExchangeType.Topic,
                    durable: true,
                    autoDelete: false,
                    cancellationToken: ct);

                await Channel.QueueDeclareAsync(
                    queue: _settings.QueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    cancellationToken: ct);

                await Channel.QueueBindAsync(
                    queue: _settings.QueueName,
                    exchange: _settings.Exchange,
                    routingKey: _settings.RoutingKey,
                    cancellationToken: ct);

                await Channel.BasicQosAsync(
                    prefetchSize: 0,
                    prefetchCount: _settings.PrefetchCount,
                    global: false,
                    cancellationToken: ct);

                _logger.LogInformation(
                    "RabbitMQ topology ready. Exchange={Exchange} Queue={Queue} RoutingKey={RoutingKey}",
                    _settings.Exchange, _settings.QueueName, _settings.RoutingKey);
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    #endregion

    #region Public Methods

    public async ValueTask DisposeAsync()
    {
        try
        {
            if (Channel is not null)
            {
                await Channel.CloseAsync();
                Channel.Dispose();
            }
        }
        finally
        {
            if (_connection is not null)
            {
                await _connection.CloseAsync();
                _connection.Dispose();
            }
        }
    }

    #endregion
}
