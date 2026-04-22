using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Profile.Infrastructure.Keycloak;
using Chimera.API.Profile.Infrastructure.Settings;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Profile.Infrastructure.Services;

/// <summary>
/// Removes per-user rows from the Soul database, then optionally deletes the Keycloak user.
/// </summary>
public sealed class UserAccountDeletionService : IUserAccountDeletionService
{

    private readonly SoulDbContext _db;
    private readonly IKeycloakAdminClient _keycloakAdmin;
    private readonly KeycloakAdminSettings _adminSettings;
    private readonly ILogger<UserAccountDeletionService> _logger;


    public UserAccountDeletionService(
        SoulDbContext db,
        IKeycloakAdminClient keycloakAdmin,
        KeycloakAdminSettings adminSettings,
        ILogger<UserAccountDeletionService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _keycloakAdmin = keycloakAdmin ?? throw new ArgumentNullException(nameof(keycloakAdmin));
        _adminSettings = adminSettings ?? throw new ArgumentNullException(nameof(adminSettings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<UserAccountDeletionResult> DeleteAllDataForUserAsync(Guid userId, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        var auditDeleted = await _db.AuditLogs
            .Where(a => a.UserId == userId)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        var cardsDeleted = await _db.AiCards
            .Where(c => c.UserId == userId)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "Account purge for {UserId}: audit_logs={Audit}, ai_cards={Cards}",
            userId,
            auditDeleted,
            cardsDeleted);

        await tx.CommitAsync(ct).ConfigureAwait(false);

        if (!_adminSettings.Enabled)
        {
            return new UserAccountDeletionResult(
                DatabasePurged: true,
                IdentityRemovedFromKeycloak: false,
                KeycloakAdminSkipped: true,
                Warning: null);
        }

        var (kcOk, kcErr) = await _keycloakAdmin.TryDeleteUserAsync(userId, ct).ConfigureAwait(false);
        if (kcOk)
        {
            return new UserAccountDeletionResult(
                DatabasePurged: true,
                IdentityRemovedFromKeycloak: true,
                KeycloakAdminSkipped: false,
                Warning: null);
        }

        return new UserAccountDeletionResult(
            DatabasePurged: true,
            IdentityRemovedFromKeycloak: false,
            KeycloakAdminSkipped: false,
            Warning: kcErr ?? "Keycloak user deletion failed.");
    }

}
