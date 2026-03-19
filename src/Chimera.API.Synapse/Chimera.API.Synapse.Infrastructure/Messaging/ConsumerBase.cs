using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Chimera.API.Synapse.Infrastructure.Settings;

namespace Chimera.API.Synapse.Infrastructure.Messaging;

/// <summary>Base consumer that deserializes RabbitMQ messages and delegates processing to subclasses.</summary>
public abstract class ConsumerBase<TMessage> : RabbitMqClientBase where TMessage : class
{
    #region Fields

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILogger _logger;

    #endregion

    #region Properties

    protected abstract string QueueName { get; }

    protected CancellationToken StoppingToken { get; set; }

    #endregion

    #region Constructors

    protected ConsumerBase(
        IOptions<RabbitMqSettings> settings,
        ILogger consumerLogger,
        ILogger baseLogger)
        : base(settings, baseLogger)
    {
        _logger = consumerLogger;
    }

    #endregion

    #region Protected Methods

    protected abstract Task HandleAsync(TMessage message, CancellationToken ct);

    protected virtual async Task OnEventReceivedAsync(object sender, BasicDeliverEventArgs @event)
    {
        if (Channel is null)
        {
            _logger.LogError("Channel is null, cannot process message. DeliveryTag={Tag}", @event.DeliveryTag);
            return;
        }

        try
        {
            var body = Encoding.UTF8.GetString(@event.Body.ToArray());
            var message = JsonSerializer.Deserialize<TMessage>(body, JsonOptions);

            if (message is null)
            {
                _logger.LogWarning("Poison message, cannot deserialize. DeliveryTag={Tag}", @event.DeliveryTag);
                await Channel.BasicNackAsync(@event.DeliveryTag, multiple: false, requeue: false);
                return;
            }

            await HandleAsync(message, StoppingToken);
            await Channel.BasicAckAsync(@event.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Error while processing message from queue. DeliveryTag={Tag}", @event.DeliveryTag);
            await Channel.BasicNackAsync(@event.DeliveryTag, multiple: false, requeue: false);
        }
    }

    #endregion
}
