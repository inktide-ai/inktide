using Chimera.Identity.Application.Models.Auth;

namespace Chimera.Identity.Application.Interfaces.Auth;

/// <summary>
/// Issues cryptographically signed access tokens and opaque refresh tokens.
/// Implementations must be thread-safe and suitable for singleton lifetime.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Creates a signed JWT access token for the given <paramref name="userId"/> and <paramref name="role"/>.
    /// The returned <see cref="IssuedToken"/> carries the serialized token string and its configured lifetime.
    /// </summary>
    IssuedToken GenerateAccessToken(string userId, string role);

    /// <summary>
    /// Creates a cryptographically random, opaque refresh token.
    /// The caller is responsible for persisting it via <see cref="IRefreshTokenStore"/>.
    /// </summary>
    IssuedToken GenerateRefreshToken();
}
