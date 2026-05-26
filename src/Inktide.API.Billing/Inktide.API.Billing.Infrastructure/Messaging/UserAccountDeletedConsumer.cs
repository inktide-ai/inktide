using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Core.Constants;
using Inktide.API.Core.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Messaging;

public sealed class UserAccountDeletedConsumer : BackgroundService
{
    private const string ConsumerGroup = "billing-user-cleanup";
    private static readonly string ConsumerName =
        $"billing-consumer-{Environment.MachineName}-{Environment.ProcessId}";

    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<UserAccountDeletedConsumer> _logger;

    public UserAccountDeletedConsumer(
        IConnectionMultiplexer redis,
        IServiceScopeFactory scopeFactory,
        ILogger<UserAccountDeletedConsumer> logger)
    {
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var db = _redis.GetDatabase();
        await EnsureConsumerGroupAsync(db, stoppingToken);
        // Recover messages orphaned in the PEL by a previous consumer crash.
        await ClaimStalePendingAsync(db, stoppingToken);

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
                {
                    // Also check the PEL periodically in case a sibling consumer crashes mid-flight.
                    await ClaimStalePendingAsync(db, stoppingToken);
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "UserAccountDeletedConsumer (billing): read error, retrying in 5s");
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

        if (eventType != StreamNames.EventTypeUserAccountDeleted)
        {
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (payload is null)
        {
            _logger.LogWarning("UserAccountDeletedConsumer (billing): entry {Id} has no payload — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        UserAccountDeletedEvent? evt;
        try
        {
            evt = JsonSerializer.Deserialize<UserAccountDeletedEvent>(payload);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "UserAccountDeletedConsumer (billing): invalid JSON in entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (evt is null)
        {
            _logger.LogWarning("UserAccountDeletedConsumer (billing): null deserialization for entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        // Transient errors — do NOT ACK; message stays in PEL for retry (ClaimStalePendingAsync re-claims it).
        await PurgeBillingDataAsync(evt.UserId, ct);
        await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
        _logger.LogInformation(
            "UserAccountDeletedConsumer (billing): processed {MessageId} for user {UserId}",
            entry.Id, evt.UserId);
    }

    /// <summary>
    /// Claims messages that have been pending (unacknowledged) in the PEL for more than 1 minute
    /// — i.e. delivered to a consumer that crashed before ACKing — and reprocesses them.
    /// </summary>
    private async Task ClaimStalePendingAsync(IDatabase db, CancellationToken ct)
    {
        try
        {
            const long minIdleMs = 60_000; // 1 minute
            var cursor = "0-0";
            StreamAutoClaimResult result;
            do
            {
                result = await db.StreamAutoClaimAsync(
                    StreamNames.IntegrationEvents,
                    ConsumerGroup,
                    ConsumerName,
                    minIdleMs,
                    cursor,
                    count: 10);

                foreach (var entry in result.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);

                cursor = result.NextStartId;
            }
            while (cursor != "0-0" && !ct.IsCancellationRequested);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "UserAccountDeletedConsumer (billing): stale PEL claim pass failed");
        }
    }

    private async Task PurgeBillingDataAsync(Guid userId, CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<ISubscriptionRepository>();
        await repo.DeleteByUserIdAsync(userId.ToString(), ct).ConfigureAwait(false);
        _logger.LogInformation("Billing data purged for user {UserId}", userId);
    }
}
