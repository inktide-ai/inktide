using Chimera.API.Identify.Application.Models.Auth;

namespace Chimera.API.Identify.Application.Interfaces.Auth;

/// <summary>
/// Application service responsible for user authentication lifecycle:
/// registration, credential-based login, refresh token rotation, and logout.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Creates a new user account with the given credentials and immediately issues a session.
    /// </summary>
    /// <exception cref="Exceptions.UserAlreadyExistsException">
    /// Thrown when <paramref name="email"/> is already registered.
    /// </exception>
    Task<AuthResult> RegisterAsync(
        string email,
        string password,
        string? displayName,
        CancellationToken ct = default);

    /// <summary>
    /// Authenticates via a dev API key <b>or</b> email+password credentials.
    /// Returns <see langword="null"/> when credentials are invalid or the account is inactive.
    /// </summary>
    Task<AuthResult?> LoginAsync(
        string? apiKey,
        string? emailOrUsername,
        string? password,
        CancellationToken ct = default);

    /// <summary>
    /// Rotates a refresh token: consumes the provided token and issues a new access/refresh pair.
    /// Returns <see langword="null"/> when the token is missing, expired, or already consumed.
    /// </summary>
    Task<AuthResult?> RefreshAsync(
        string refreshToken,
        CancellationToken ct = default);

    /// <summary>Revokes the given refresh token, ending the session. Idempotent — safe to call even if already expired.</summary>
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
