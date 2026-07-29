namespace Inktide.API.Profile.Infrastructure.Keycloak;

/// <summary>
/// Realm user operations via Keycloak Admin REST API (client credentials).
/// </summary>
public interface IKeycloakAdminClient
{
    /// <summary>
    /// Returns true if the user was deleted or Admin integration is disabled; false on failure.
    /// </summary>
    Task<(bool Success, string? ErrorMessage)> TryDeleteUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Sets a single-valued user attribute (replaces existing values for that key). Requires Admin API enabled.
    /// </summary>
    Task<(bool Success, string? ErrorMessage)> TrySetUserAttributeAsync(
        Guid userId,
        string attributeName,
        IReadOnlyList<string> values,
        CancellationToken ct = default);

    /// <summary>Updates the user's primary email in Keycloak and marks it as verified.</summary>
    Task<(bool Success, string? ErrorMessage)> TryUpdateUserEmailAsync(
        Guid userId,
        string newEmail,
        CancellationToken ct = default);
}
