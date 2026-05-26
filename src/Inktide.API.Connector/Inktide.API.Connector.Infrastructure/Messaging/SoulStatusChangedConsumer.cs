using System.Text.Json;
using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Core.Constants;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Consumes soul.status.changed integration events from the shared Redis stream and
/// joins or leaves platform channels in real time.
/// </summary>
public sealed class SoulStatusChangedConsumer : BackgroundService
{
    private const string ConsumerGroup = "connector-soul-control";
    private const string ConsumerName  = "connector-soul-control-1";

    private readonly IConnectionMultiplexer _redis;
    private readonly IEnumerable<IChatConnector> _connectors;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SoulStatusChangedConsumer> _logger;

    public SoulStatusChangedConsumer(
        IConnectionMultiplexer redis,
        IEnumerable<IChatConnector> connectors,
        IServiceScopeFactory scopeFactory,
        ILogger<SoulStatusChangedConsumer> logger)
    {
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _connectors   = connectors   ?? throw new ArgumentNullException(nameof(connectors));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var db = _redis.GetDatabase();
        await EnsureConsumerGroupAsync(db, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    StreamNames.IntegrationEvents,
                    ConsumerGroup,
                    ConsumerName,
                    position: null,
                    count: 10,
                    noAck: false);

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, stoppingToken);

                if (entries.Length == 0)
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SoulStatusChangedConsumer: read error, retrying in 5s");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        try
        {
            await db.StreamCreateConsumerGroupAsync(
                StreamNames.IntegrationEvents,
                ConsumerGroup,
                StreamPosition.Beginning,
                createStream: true);
        }
        catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogDebug("Consumer group '{Group}' already exists", ConsumerGroup);
        }
    }

    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        string? eventType = null;
        string? payload   = null;

        foreach (var kv in entry.Values)
        {
            if (kv.Name == "eventType") eventType = kv.Value;
            if (kv.Name == "payload")   payload   = kv.Value;
        }

        if (eventType != StreamNames.EventTypeSoulStatusChanged)
        {
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (payload is null)
        {
            _logger.LogWarning("SoulStatusChangedConsumer: entry {Id} has no payload — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        SoulStatusPayload? evt;
        try { evt = JsonSerializer.Deserialize<SoulStatusPayload>(payload, JsonOptions.Read); }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "SoulStatusChangedConsumer: invalid JSON in entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (evt is null)
        {
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        await ApplyStatusChangeAsync(evt, ct);
        await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);

        _logger.LogInformation(
            "SoulStatusChangedConsumer: processed soul {CardId} → IsActive={IsActive} Status={Status}",
            evt.CardId, evt.IsActive, evt.Status);
    }

    private async Task ApplyStatusChangeAsync(SoulStatusPayload evt, CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAiCardChannelRepository>();

        var channels = await repo.GetByCardIdAsync(evt.CardId, ct).ConfigureAwait(false);
        var activeChannels = channels.Where(c => c.IsActive && !string.IsNullOrEmpty(c.ChannelId)).ToList();

        var isStart = evt.IsActive && string.Equals(evt.Status, "Active", StringComparison.OrdinalIgnoreCase);

        foreach (var channel in activeChannels)
        {
            var connector = _connectors.FirstOrDefault(c =>
                string.Equals(c.PlatformId, channel.Platform, StringComparison.OrdinalIgnoreCase));

            if (connector is null)
            {
                _logger.LogDebug("No connector for platform {Platform} — skipping channel {Channel}",
                    channel.Platform, channel.ChannelId);
                continue;
            }

            if (isStart)
                await connector.JoinChannelAsync(channel.ChannelId!, evt.CardId, ct).ConfigureAwait(false);
            else
                await connector.LeaveChannelAsync(channel.ChannelId!, evt.CardId, ct).ConfigureAwait(false);
        }
    }

    private sealed record SoulStatusPayload(Guid CardId, bool IsActive, string Status);

    private static class JsonOptions
    {
        public static readonly JsonSerializerOptions Read = new()
        {
            PropertyNameCaseInsensitive = true,
        };
    }
}
