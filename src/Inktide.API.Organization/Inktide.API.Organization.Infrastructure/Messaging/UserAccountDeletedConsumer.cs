using System.Text.Json;
using Inktide.API.Core.Constants;
using Inktide.API.Core.Events;
using Inktide.API.Organization.Application.Enums;
using Inktide.API.Organization.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Organization.Infrastructure.Messaging;

public sealed class UserAccountDeletedConsumer : BackgroundService
{
    private const string ConsumerGroup    = "org-user-cleanup";
    private const string ConsumerName     = "org-consumer-1";
    private const int    PelRecoveryInterval = 50;

    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<UserAccountDeletedConsumer> _logger;

    private int _pollCount;

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

                if (++_pollCount % PelRecoveryInterval == 0)
                    await RecoverPendingEntriesAsync(db, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "UserAccountDeletedConsumer (org): read error, retrying in 5s");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task RecoverPendingEntriesAsync(IDatabase db, CancellationToken ct)
    {
        try
        {
            var result = await db.StreamAutoClaimAsync(
                StreamNames.IntegrationEvents,
                ConsumerGroup,
                ConsumerName,
                60_000,      // minIdleTimeInMs - claim messages idle > 60 s
                "0-0",       // startAt - scan from beginning of PEL
                10);

            foreach (var entry in result.ClaimedEntries)
                await ProcessEntryAsync(db, entry, ct);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "UserAccountDeletedConsumer (org): PEL recovery failed");
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
            _logger.LogWarning("UserAccountDeletedConsumer (org): entry {Id} has no payload — discarding", entry.Id);
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
            _logger.LogError(ex, "UserAccountDeletedConsumer (org): invalid JSON in entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        if (evt is null)
        {
            _logger.LogWarning("UserAccountDeletedConsumer (org): null deserialization for entry {Id} — discarding", entry.Id);
            await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
            return;
        }

        // Transient errors - do NOT ACK; message stays in PEL for retry.
        // PEL recovery runs every PelRecoveryInterval polls via RecoverPendingEntriesAsync.
        await PurgeOrgDataAsync(evt.UserId, ct);
        await db.StreamAcknowledgeAsync(StreamNames.IntegrationEvents, ConsumerGroup, entry.Id);
        _logger.LogInformation(
            "UserAccountDeletedConsumer (org): processed {MessageId} for user {UserId}",
            entry.Id, evt.UserId);
    }

    private async Task PurgeOrgDataAsync(Guid userId, CancellationToken ct)
    {
        var userIdStr = userId.ToString();

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<OrganizationDbContext>();

        await using var tx = await db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        var memberOrgIds = await db.OrganizationMembers
            .Where(m => m.UserId == userIdStr)
            .Select(m => m.OrganizationId)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        // Guard: skip orgs where this user is the sole admin but other members exist.
        // Single query - avoids Nx3 round trips from per-org CountAsync calls.
        var orgStats = await db.OrganizationMembers
            .Where(m => memberOrgIds.Contains(m.OrganizationId))
            .GroupBy(m => m.OrganizationId)
            .Select(g => new
            {
                OrgId       = g.Key,
                AdminCount  = g.Count(m => m.Role == OrganizationRole.Admin),
                TotalCount  = g.Count(),
                UserIsAdmin = g.Any(m => m.UserId == userIdStr && m.Role == OrganizationRole.Admin),
            })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var blockedOrgIds = orgStats
            .Where(s => s.UserIsAdmin && s.AdminCount == 1 && s.TotalCount > 1)
            .Select(s => s.OrgId)
            .ToList();

        if (blockedOrgIds.Count > 0)
        {
            _logger.LogWarning(
                "UserAccountDeletedConsumer (org): user {UserId} is sole admin of {Count} org(s) with other members — " +
                "skipping those orgs, manual admin transfer required. OrgIds: {OrgIds}",
                userId, blockedOrgIds.Count, string.Join(", ", blockedOrgIds));
            // memberOrgIds is List<Guid> (from .ToListAsync above) - reassignment is valid
            memberOrgIds = memberOrgIds.Except(blockedOrgIds).ToList();
        }

        // Find orgs where this user is now the only remaining member.
        // If sole member -> delete the org (cascade removes the membership and invites via FK).
        // If other members exist -> remove only this user's membership.
        var orgsToDelete = orgStats
            .Where(s => !blockedOrgIds.Contains(s.OrgId) && s.TotalCount == 1)
            .Select(s => s.OrgId)
            .ToList();

        var orgsDeleted = 0;
        if (orgsToDelete.Count > 0)
        {
            // Cascade on DB FK removes organization_members and organization_invites for these orgs.
            orgsDeleted = await db.Organizations
                .Where(o => orgsToDelete.Contains(o.Id))
                .ExecuteDeleteAsync(ct)
                .ConfigureAwait(false);
        }

        // Remove remaining memberships (orgs with other members).
        var membershipsDeleted = await db.OrganizationMembers
            .Where(m => m.UserId == userIdStr && memberOrgIds.Contains(m.OrganizationId))
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        // Remove invites sent by this user (already-accepted ones remain as historical records).
        var invitesDeleted = await db.OrganizationInvites
            .Where(i => i.InvitedBy == userIdStr)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        await tx.CommitAsync(ct).ConfigureAwait(false);

        _logger.LogInformation(
            "Org data purged for user {UserId}: orgs_deleted={Orgs}, memberships={Members}, invites={Invites}",
            userId, orgsDeleted, membershipsDeleted, invitesDeleted);
    }
}
