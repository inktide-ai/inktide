using Chimera.ApiGateway.Application.Models.Auth;

namespace Chimera.ApiGateway.Application.Interfaces.Auth;

/// <summary>
/// Atomic, one-time-use refresh token storage with token-family reuse detection.
/// </summary>
/// <remarks>
/// <b>Token family pattern:</b> every token issued in the same session shares a <c>FamilyId</c>.
/// Presenting an already-consumed token from a family triggers immediate revocation of the whole
/// family, forcing the attacker <b>and</b> the legitimate user to re-authenticate.
/// </remarks>
public interface IRefreshTokenStore
{
    /// <summary>
    /// Persists <paramref name="refreshToken"/> bound to the given principal and family for <paramref name="lifetime"/>.
    /// </summary>
    Task StoreAsync(
        string refreshToken,
        string userId,
        string role,
        string familyId,
        TimeSpan lifetime,
        CancellationToken ct = default);

    /// <summary>
    /// Atomically consumes (reads + deletes) the token for rotation.
    /// Stores a consumed marker so that a replay of this token can be detected.
    /// Returns <see langword="null"/> when the token is invalid, expired, or its family is compromised.
    /// Automatically revokes the entire family on reuse detection.
    /// </summary>
    Task<RefreshTokenPayload?> ConsumeAsync(
        string refreshToken,
        CancellationToken ct = default);

    /// <summary>
    /// Deletes the token without leaving a consumed marker.
    /// Used for explicit logout — does not trigger reuse detection.
    /// </summary>
    Task DeleteAsync(string refreshToken, CancellationToken ct = default);
}
