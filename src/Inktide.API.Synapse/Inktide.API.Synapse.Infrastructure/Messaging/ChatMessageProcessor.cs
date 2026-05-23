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
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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
        var payloadJson = TryGetPayload(entry);
        if (payloadJson is null)
        {
            _logger.LogWarning(
                "Stream entry {Id} missing payload field {Field}", entry.Id, _settings.PayloadFieldName);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
        }

        var message = JsonSerializer.Deserialize<ChatMessage>(payloadJson, JsonOptions);
        if (message is null)
        {
            _logger.LogWarning("Poison message, cannot deserialize. Id={Id}", entry.Id);
            await db.StreamAcknowledgeAsync(_settings.StreamName, _settings.ConsumerGroup, entry.Id);
            return;
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
            _logger.LogCritical(ex, "Error while processing stream entry. Id={Id}", entry.Id);
        }
    }

    private string? TryGetPayload(StreamEntry entry)
    {
        foreach (var v in entry.Values)
        {
            if (v.Name.ToString() == _settings.PayloadFieldName)
                return v.Value.ToString();
        }

        return null;
    }
}
