using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Infrastructure.Outbox;

/// <summary>
/// Polls soul.outbox_events for unprocessed entries and delivers them.
/// GraphImport events are delivered in-process via IGraphDefinitionImporter.
/// All other events are published to the integration event stream via IIntegrationEventPublisher.
/// </summary>
public sealed class OutboxProcessorHostedService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan RetentionPeriod = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IIntegrationEventPublisher _publisher;
    private readonly ILogger<OutboxProcessorHostedService> _logger;

    public OutboxProcessorHostedService(
        IServiceScopeFactory scopeFactory,
        IIntegrationEventPublisher publisher,
        ILogger<OutboxProcessorHostedService> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _publisher    = publisher    ?? throw new ArgumentNullException(nameof(publisher));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxProcessorHostedService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken).ConfigureAwait(false);
                await CleanupProcessedAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OutboxProcessorHostedService: unexpected error during poll");
            }

            await Task.Delay(PollInterval, stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("OutboxProcessorHostedService stopped");
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db       = scope.ServiceProvider.GetRequiredService<SoulDbContext>();
        var importer = scope.ServiceProvider.GetService<IGraphDefinitionImporter>();

        var pending = await db.OutboxEvents
            .Where(e => e.ProcessedAt == null)
            .OrderBy(e => e.CreatedAt)
            .Take(10)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (pending.Count == 0) return;

        foreach (var evt in pending)
        {
            try
            {
                await DeliverAsync(evt, importer, ct).ConfigureAwait(false);
                evt.ProcessedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "OutboxProcessorHostedService: failed to deliver event {EventId} ({EventType})",
                    evt.Id, evt.EventType);
                evt.Error = ex.Message;
                evt.ProcessedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    private async Task DeliverAsync(
        Domain.Entities.OutboxEvent evt,
        IGraphDefinitionImporter? importer,
        CancellationToken ct)
    {
        // GraphImport events are handled in-process for backward compatibility.
        if (evt.EventType == "GraphImport")
        {
            if (importer is null)
            {
                _logger.LogWarning(
                    "OutboxProcessorHostedService: IGraphDefinitionImporter not registered — GraphImport event {EventId} skipped",
                    evt.Id);
                return;
            }

            using var doc = JsonDocument.Parse(evt.Payload);
            var root = doc.RootElement;

            Guid importId;
            if (root.TryGetProperty("projectId", out var projectIdEl))
                importId = projectIdEl.GetGuid();
            else
                importId = root.GetProperty("characterId").GetGuid();

            var userId    = root.GetProperty("userId").GetGuid();
            var graphJson = root.GetProperty("graphJson").GetString()!;

            await importer.ImportAsync(importId, userId, graphJson, ct).ConfigureAwait(false);

            _logger.LogInformation(
                "OutboxProcessorHostedService: GraphImport delivered. ProjectId={ProjectId}", importId);
            return;
        }

        // All other event types go to the integration event stream (Redis Streams / future Kafka).
        await _publisher.PublishAsync(evt.EventType, evt.Payload, ct).ConfigureAwait(false);

        _logger.LogDebug(
            "OutboxProcessorHostedService: published {EventType} ({EventId}) to integration stream",
            evt.EventType, evt.Id);
    }

    private async Task CleanupProcessedAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SoulDbContext>();

        var cutoff = DateTime.UtcNow - RetentionPeriod;
        var deleted = await db.OutboxEvents
            .Where(e => e.ProcessedAt != null && e.ProcessedAt < cutoff)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        if (deleted > 0)
            _logger.LogDebug("OutboxProcessorHostedService: cleaned up {Count} processed events", deleted);
    }
}
