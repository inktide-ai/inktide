using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Chimera.AI.Orchestrator.Infrastructure.Models;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>
/// Background worker that consumes messages from RabbitMQ and delegates them to <see cref="IChatMessageHandler"/>.
/// Uses <c>AsyncEventingBasicConsumer</c> for non-blocking, event-driven consumption.
/// </summary>
public sealed class RabbitMqConsumerWorker : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RabbitMqConnectionProvider _connectionProvider;
    private readonly IChatMessageHandler _messageHandler;
    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqConsumerWorker> _logger;

    private long _consumedCount;
    private long _errorCount;

    public RabbitMqConsumerWorker(
        RabbitMqConnectionProvider connectionProvider,
        IChatMessageHandler messageHandler,
        IOptions<RabbitMqSettings> settings,
        ILogger<RabbitMqConsumerWorker> logger)
    {
        _connectionProvider = connectionProvider;
        _messageHandler = messageHandler;
        _settings = settings.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RabbitMQ consumer worker starting. Queue: {Queue}", _settings.QueueName);

        IChannel? channel = null;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                channel = await _connectionProvider.GetChannelAsync(stoppingToken);
                break;
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Failed to connect to RabbitMQ, retrying in 5s...");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        if (channel is null || stoppingToken.IsCancellationRequested)
            return;

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.Span);
                var message = JsonSerializer.Deserialize<ChatMessage>(json, JsonOptions);

                if (message is null)
                {
                    _logger.LogWarning("Deserialized null message, nacking. DeliveryTag={Tag}", ea.DeliveryTag);
                    await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: false, stoppingToken);
                    return;
                }

                await _messageHandler.HandleAsync(message, stoppingToken);

                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, stoppingToken);

                var count = Interlocked.Increment(ref _consumedCount);
                if (count % 1000 == 0)
                    _logger.LogInformation("RabbitMQ consumer stats: consumed={Consumed}, errors={Errors}",
                        count, Interlocked.Read(ref _errorCount));
            }
            catch (Exception ex)
            {
                Interlocked.Increment(ref _errorCount);
                _logger.LogError(ex, "Error processing message. DeliveryTag={Tag}", ea.DeliveryTag);

                try
                {
                    await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: true, stoppingToken);
                }
                catch (Exception nackEx)
                {
                    _logger.LogError(nackEx, "Failed to nack message. DeliveryTag={Tag}", ea.DeliveryTag);
                }
            }
        };

        await channel.BasicConsumeAsync(
            queue: _settings.QueueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        _logger.LogInformation("RabbitMQ consumer attached to queue {Queue}. Waiting for messages...", _settings.QueueName);

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // graceful shutdown
        }

        _logger.LogInformation(
            "RabbitMQ consumer worker stopping. Total consumed={Consumed}, errors={Errors}",
            Interlocked.Read(ref _consumedCount), Interlocked.Read(ref _errorCount));
    }
}
