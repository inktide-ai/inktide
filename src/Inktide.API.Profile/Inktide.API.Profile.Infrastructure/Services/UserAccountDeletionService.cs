using System.Text.Json;
using Inktide.API.Core.Constants;
using Inktide.API.Core.Events;
using Inktide.API.Core.Transactions;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Application.Messages;
using Inktide.API.Profile.Infrastructure.DbContext;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class UserAccountDeletionService : IUserAccountDeletionService
{
    private readonly ProfileDbContext _db;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IIntegrationEventPublisher _publisher;
    private readonly ILogger<UserAccountDeletionService> _logger;

    public UserAccountDeletionService(
        ProfileDbContext db,
        IPublishEndpoint publishEndpoint,
        IIntegrationEventPublisher publisher,
        ILogger<UserAccountDeletionService> logger)
    {
        _db              = db              ?? throw new ArgumentNullException(nameof(db));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _publisher       = publisher       ?? throw new ArgumentNullException(nameof(publisher));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<UserAccountDeletionResult> DeleteAllDataForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var userIdStr = userId.ToString();

        await using var tx = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        // Delete profile data and atomically enqueue Keycloak deletion via outbox
        await _db.UserProfiles
            .Where(p => p.UserId == userIdStr)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        // Publishes to MT EF outbox — persisted atomically with the DELETE above
        await _publishEndpoint
            .Publish(new KeycloakDeleteUserRequested(userId), ct)
            .ConfigureAwait(false);

        await _db.SaveChangesAsync(ct).ConfigureAwait(false); // flushes the outbox row
        await tx.CommitAsync(ct).ConfigureAwait(false);

        _logger.LogInformation("User {UserId} data deleted; Keycloak deletion queued", userId);

        // Best-effort Redis fanout for Soul/Billing/Org consumers (unchanged until P3)
        var evt     = new UserAccountDeletedEvent(userId);
        var payload = JsonSerializer.Serialize(evt);
        await _publisher.PublishAsync(StreamNames.EventTypeUserAccountDeleted, payload, ct).ConfigureAwait(false);

        return new UserAccountDeletionResult(
            DatabasePurged: false,
            IdentityRemovedFromKeycloak: false,
            KeycloakAdminSkipped: false,
            Warning: null);
    }
}
