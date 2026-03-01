using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>
/// Manages a singleton RabbitMQ connection and ensures the exchange/queue topology exists.
/// </summary>
public sealed class RabbitMqConnectionProvider : IAsyncDisposable
{
    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqConnectionProvider> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqConnectionProvider(
        IOptions<RabbitMqSettings> settings,
        ILogger<RabbitMqConnectionProvider> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsConnected => _connection is { IsOpen: true };

    public async Task<IChannel> GetChannelAsync(CancellationToken ct = default)
    {
        if (_channel is { IsOpen: true })
            return _channel;

        await _lock.WaitAsync(ct);
        try
        {
            if (_channel is { IsOpen: true })
                return _channel;

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
                "RabbitMQ connected to {Host}:{Port}/{VHost}",
                _settings.Host, _settings.Port, _settings.VirtualHost);

            _channel = await _connection.CreateChannelAsync(cancellationToken: ct);

            await _channel.ExchangeDeclareAsync(
                exchange: _settings.Exchange,
                type: ExchangeType.Topic,
                durable: true,
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

            await _channel.BasicQosAsync(
                prefetchSize: 0,
                prefetchCount: _settings.PrefetchCount,
                global: false,
                cancellationToken: ct);

            _logger.LogInformation(
                "RabbitMQ topology ready: exchange={Exchange}, queue={Queue}, routingKey={RoutingKey}, prefetch={Prefetch}",
                _settings.Exchange, _settings.QueueName, _settings.RoutingKey, _settings.PrefetchCount);

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
}
