using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using Chimera.ApiGateway.Application.Models.Streaming;
using Chimera.ApiGateway.Infrastructure.Settings;

namespace Chimera.ApiGateway.Infrastructure.Messaging;

/// <summary>
/// Background worker that drains the message queue and publishes to RabbitMQ.
/// Single consumer — avoids channel contention on the AMQP side.
/// </summary>
public sealed class RabbitMqPublisherWorker : BackgroundService
{
    #region Constants

    private const int MaxRetries = 3;

    #endregion

    #region Fields

    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromMilliseconds(500),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(5)
    ];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly IChatMessageQueue _queue;
    private readonly IRabbitMqChannelProvider _channelProvider;
    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqPublisherWorker> _logger;

    private long _publishedCount;
    private long _errorCount;

    #endregion

    #region Constructors

    public RabbitMqPublisherWorker(
        IChatMessageQueue queue,
        IRabbitMqChannelProvider channelProvider,
        IOptions<RabbitMqSettings> settings,
        ILogger<RabbitMqPublisherWorker> logger)
    {
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _channelProvider = channelProvider ?? throw new ArgumentNullException(nameof(channelProvider));
        _settings = settings.Value;
        _logger = logger;
    }

    #endregion

    #region Protected Methods

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RabbitMQ publisher worker started.");

        await foreach (var message in _queue.ConsumeAllAsync(stoppingToken))
        {
            try
            {
                await PublishWithRetryAsync(message, stoppingToken);

                _publishedCount++;
                if (_publishedCount % 1000 == 0)
                {
                    _logger.LogInformation(
                        "RabbitMQ publisher stats: {Published} published, {Errors} errors",
                        _publishedCount, _errorCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _errorCount++;
                _logger.LogError(ex,
                    "Message permanently lost after {MaxRetries} retries. Platform={Platform} User={User}",
                    MaxRetries, message.PlatformId, message.Sender.UserName);
            }
        }

        _logger.LogInformation(
            "RabbitMQ publisher worker stopped. Published={Published} Errors={Errors}",
            _publishedCount, _errorCount);
    }

    #endregion

    #region Private Methods

    private async Task PublishWithRetryAsync(ChatMessage message, CancellationToken ct)
    {
        for (var attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                await PublishAsync(message, ct);
                return;
            }
            catch (OperationCanceledException) { throw; }
            catch (Exception ex) when (attempt < MaxRetries)
            {
                _logger.LogWarning(ex,
                    "Publish attempt {Attempt}/{MaxRetries} failed. Platform={Platform} User={User} RetryIn={Delay}ms",
                    attempt + 1, MaxRetries, message.PlatformId, message.Sender.UserName,
                    (int)RetryDelays[attempt].TotalMilliseconds);

                await Task.Delay(RetryDelays[attempt], ct);
            }
        }
    }

    private async Task PublishAsync(ChatMessage message, CancellationToken ct)
    {
        var channel = await _channelProvider.GetChannelAsync(ct);

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, JsonOptions));

        var props = new BasicProperties
        {
            ContentType = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
            Timestamp = new AmqpTimestamp(message.Timestamp.ToUnixTimeSeconds()),
            Headers = new Dictionary<string, object?>
            {
                ["platform"] = message.PlatformId,
                ["channel_id"] = message.ChannelId
            }
        };

        await channel.BasicPublishAsync(
            exchange: _settings.Exchange,
            routingKey: _settings.RoutingKey,
            mandatory: false,
            basicProperties: props,
            body: body,
            cancellationToken: ct);
    }

    #endregion
}
