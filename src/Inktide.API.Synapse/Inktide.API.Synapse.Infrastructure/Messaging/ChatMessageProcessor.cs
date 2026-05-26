using System.Text.Json;
using Inktide.API.Core.Settings;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal sealed class ChatMessageProcessor : IChatMessageProcessor
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SynapseIngestStreamSettings _settings;
    private readonly ILogger<ChatMessageProcessor> _logger;

    public ChatMessageProcessor(
        IServiceScopeFactory scopeFactory,
        IOptions<SynapseIngestStreamSettings> settings,
        ILogger<ChatMessageProcessor> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _settings     = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger       = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = entry.GetField(_settings.PayloadFieldName);
        if (payloadJson is null)
        {
            _logger.LogWarning(
                "Stream entry {Id} missing payload field {Field}", entry.Id, _settings.PayloadFieldName);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        var message = JsonSerializer.Deserialize<ChatMessage>(payloadJson, SynapseConstants.Json.Read);
        if (message is null)
        {
            _logger.LogWarning("Poison message, cannot deserialize. Id={Id}", entry.Id);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        if (message.CharacterId.HasValue)
        {
            var isBlocked = await db.KeyExistsAsync($"soul:{message.CharacterId.Value}:blocked");
            if (isBlocked)
            {
                _logger.LogDebug("Soul {CardId} is paused/stopped — discarding message from {Channel}",
                    message.CharacterId.Value, message.ChannelName);
                await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
                return;
            }
        }
        else
        {
            _logger.LogWarning(
                "Message from channel {Channel} has no CharacterId — gate check skipped. Platform={Platform}",
                message.ChannelName, message.PlatformId);
        }

        if (DateTimeOffset.UtcNow - message.Timestamp > SynapseConstants.Messaging.MessageStalenessThreshold)
        {
            _logger.LogInformation(
                "Stale message dropped. Age={AgeMs}ms User={User} Channel={Channel}",
                (long)(DateTimeOffset.UtcNow - message.Timestamp).TotalMilliseconds,
                message.Sender.UserName,
                message.ChannelName);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        try
        {
            _logger.LogDebug(
                "Processing message from {User} in {Channel}",
                message.Sender.UserName, message.ChannelName);

            using var scope = _scopeFactory.CreateScope();
            var orchestrator = scope.ServiceProvider.GetRequiredService<ISynapseIngestOrchestrator>();
            var context = new MessageProcessingContext
            {
                Message            = message,
                TransportMessageId = entry.Id.ToString()!,
                CorrelationId      = entry.Id.ToString()!
            };
            await orchestrator.ProcessAsync(context, ct);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while processing stream entry. Id={Id}", entry.Id);
            await HandleFailedEntryAsync(db, entry, ex, ct);
        }
    }

    private async Task HandleFailedEntryAsync(
        IDatabase db, StreamEntry entry, Exception ex, CancellationToken ct)
    {
        // Check how many times XAUTOCLAIM has already delivered this entry.
        var pending = await db.StreamPendingMessagesAsync(
            _settings.StreamName, _settings.ConsumerGroup,
            count: 1, consumerName: RedisValue.Null, minId: entry.Id, maxId: entry.Id);

        var deliveries = pending.Length > 0 ? (int)pending[0].DeliveryCount : 1;
        if (deliveries < _settings.MaxPoisonMessageDeliveries) return;

        _logger.LogCritical(
            "Poison message detected after {Deliveries} deliveries — moving to DLQ and ACKing. Id={Id}",
            deliveries, entry.Id);

        if (!string.IsNullOrEmpty(_settings.DeadLetterStreamName))
        {
            try
            {
                await db.StreamAddAsync(
                    _settings.DeadLetterStreamName,
                    [
                        new NameValueEntry("originalId",  entry.Id.ToString()),
                        new NameValueEntry("failedAtUtc", DateTimeOffset.UtcNow.ToString("O")),
                        new NameValueEntry("deliveries",  deliveries.ToString()),
                        new NameValueEntry("error",       ex.Message),
                        new NameValueEntry("payload",     entry.GetField(_settings.PayloadFieldName) ?? string.Empty),
                    ],
                    maxLength: 10_000,
                    useApproximateMaxLength: true);
            }
            catch (Exception dlqEx)
            {
                _logger.LogCritical(dlqEx,
                    "Failed to write poison message to DLQ — ACKing anyway to unblock pipeline. Id={Id}",
                    entry.Id);
            }
        }

        await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
    }
}
