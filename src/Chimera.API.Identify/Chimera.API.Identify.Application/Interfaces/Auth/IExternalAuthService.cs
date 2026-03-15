using Chimera.API.Identify.Application.Models.Auth;

namespace Chimera.API.Identify.Application.Interfaces.Auth;

/// <summary>
/// Handles OAuth-based authentication: find or create user from provider claims, issue session.
/// </summary>
public interface IExternalAuthService
{
    /// <summary>
    /// Resolves user from Google OAuth claims and issues a session.
    /// Finds by google_id, or by email (and links), or creates new user.
    /// </summary>
    Task<AuthResult> AuthenticateGoogleAsync(
        string googleId,
        string email,
        string? displayName,
        CancellationToken ct = default);

    /// <summary>
    /// Resolves user from Twitch OAuth claims and issues a session.
    /// Finds by twitch_id, or by email (and links), or creates new user.
    /// </summary>
    Task<AuthResult> AuthenticateTwitchAsync(
        string twitchId,
        string email,
        string? displayName,
        CancellationToken ct = default);
}
