using System.Text.Json;
using Inktide.API.Core.Constants;
using Inktide.API.Core.Events;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Soul.Infrastructure.Messaging;

public sealed class UserAccountDeletedConsumer : BackgroundService
{
    private const string ConsumerGroup = "soul-user-cleanup";
    private const string ConsumerName  = "soul-consumer-1";

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
        try
        {
            await EnsureConsumerGroupAsync(db, stoppingToken);
        }
        catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
        {
            // TODO: wire up an alert on this log message — in Kubernetes, LogCritical goes to stdout
            // but without an explicit alert rule the consumer is silently inactive until pod restart.
            _logger.LogCritical(ex, "UserAccountDeletedConsumer: failed to create consumer group — consumer will not process events");
            return;
        }

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
                _logger.LogWarning(ex, "UserAccountDeletedConsumer: read error, retrying in 5s");
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

        // Poison-message path: unrecoverable — ACK to prevent infinite retry.
        if (payload is null)
        {
            _logger.LogWarning("UserAccountDeletedConsumer: entry {Id} has no payload — discarding", entry.Id);
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
            _logger.LogError(ex, "UserAccountDeletedConsumer: invalid JSON in entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (evt is null)
        {
            _logger.LogWarning("UserAccountDeletedConsumer: null deserialization for entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        // Transient errors (DB unavailable, network, deadlock) — do NOT ACK.
        // Message stays in PEL; will be redelivered after consumer restart or via XAUTOCLAIM.
        await PurgeSoulDataAsync(evt.UserId, ct);
        await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
        _logger.LogInformation(
            "UserAccountDeletedConsumer: processed {MessageId} for user {UserId}",
            entry.Id, evt.UserId);
    }

    private async Task PurgeSoulDataAsync(Guid userId, CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SoulDbContext>();

        await using var tx = await db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        var auditDeleted = await db.AuditLogs
            .Where(a => a.UserId == userId)
            .ExecuteDeleteAsync(ct).ConfigureAwait(false);

        // Cascade on DB FK removes child tables: channels, models, scenes, run_presets, usage_daily, memory_metadata
        var cardsDeleted = await db.AiCards
            .IgnoreQueryFilters()
            .Where(c => c.UserId == userId)
            .ExecuteDeleteAsync(ct).ConfigureAwait(false);

        // No FK to AiCard — must delete explicitly
        var credentialsDeleted = await db.UserProviderCredentials
            .Where(c => c.UserId == userId)
            .ExecuteDeleteAsync(ct).ConfigureAwait(false);

        await tx.CommitAsync(ct).ConfigureAwait(false);

        _logger.LogInformation(
            "Soul data purged for user {UserId}: audit_logs={Audit}, ai_cards={Cards}, credentials={Creds}",
            userId, auditDeleted, cardsDeleted, credentialsDeleted);
    }
}
