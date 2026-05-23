namespace Inktide.API.Profile.Application.Interfaces;

public interface IEmailChangeService
{
    /// <summary>Generates a verification code, stores it in Redis, and sends it to <paramref name="newEmail"/>.</summary>
    Task RequestChangeAsync(string userId, string newEmail, CancellationToken ct = default);

    /// <summary>
    /// Validates <paramref name="code"/> against the pending request for <paramref name="userId"/>.
    /// On success updates Keycloak email and returns the new email address; returns <c>null</c> on invalid/expired code.
    /// </summary>
    Task<string?> VerifyAndChangeAsync(string userId, string code, CancellationToken ct = default);
}
