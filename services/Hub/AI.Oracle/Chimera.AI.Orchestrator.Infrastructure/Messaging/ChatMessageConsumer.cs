using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Chimera.AI.Orchestrator.Application.Interfaces;
using Chimera.AI.Orchestrator.Application.Models;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Messaging;

/// <summary>Consumes ChatMessage events from RabbitMQ and feeds them into the processing pipeline.</summary>
public sealed class ChatMessageConsumer : ConsumerBase<ChatMessage>, IHostedService
{
    #region Fields

    private readonly IMessagePipeline _pipeline;
    private readonly ILogger<ChatMessageConsumer> _consumerLogger;
    private CancellationTokenSource? _cts;

    #endregion

    #region Properties

    protected override string QueueName { get; }

    #endregion

    #region Constructors

    public ChatMessageConsumer(
        IMessagePipeline pipeline,
        IOptions<RabbitMqSettings> settings,
        ILogger<ChatMessageConsumer> consumerLogger,
        ILogger<RabbitMqClientBase> baseLogger)
        : base(settings, consumerLogger, baseLogger)
    {
        _pipeline = pipeline;
        _consumerLogger = consumerLogger;
        QueueName = settings.Value.QueueName;
    }

    #endregion

    #region Public Methods

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _cts = new CancellationTokenSource();
        StoppingToken = _cts.Token;

        await ConnectToRabbitMqAsync(cancellationToken);

        var consumer = new AsyncEventingBasicConsumer(Channel!);
        consumer.ReceivedAsync += OnEventReceivedAsync;
        await Channel!.BasicConsumeAsync(
            queue: QueueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: cancellationToken);

        _consumerLogger.LogInformation("ChatMessageConsumer started. Queue={Queue}", QueueName);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _consumerLogger.LogInformation("ChatMessageConsumer stopping");
        _cts?.Cancel();
        _cts?.Dispose();
        await DisposeAsync();
    }

    #endregion

    #region Protected Methods

    protected override async Task HandleAsync(ChatMessage message, CancellationToken ct)
    {
        _consumerLogger.LogDebug(
            "Processing message from {User} in {Channel}",
            message.Sender.UserName, message.ChannelName);

        var context = new MessageProcessingContext { Message = message };
        await _pipeline.RunAsync(context, ct);
    }

    #endregion
}
