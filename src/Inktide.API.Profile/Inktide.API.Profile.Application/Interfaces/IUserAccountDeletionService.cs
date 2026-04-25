namespace Inktide.API.Profile.Application.Interfaces;

/// <summary>
/// Purges Soul application data for a user and optionally deletes the Keycloak user.
/// </summary>
public interface IUserAccountDeletionService
{
    Task<UserAccountDeletionResult> DeleteAllDataForUserAsync(Guid userId, CancellationToken ct = default);
}

/// <param name="DatabasePurged">True when Soul DB rows for this user were removed.</param>
/// <param name="IdentityRemovedFromKeycloak">True when Keycloak Admin deleted the user (or returned 404).</param>
/// <param name="KeycloakAdminSkipped">True when Admin API is not configured — user must remove the account in IdP manually.</param>
/// <param name="Warning">Non-fatal issues (e.g. Keycloak Admin was enabled but delete failed).</param>
public sealed record UserAccountDeletionResult(
    bool DatabasePurged,
    bool IdentityRemovedFromKeycloak,
    bool KeycloakAdminSkipped,
    string? Warning);
