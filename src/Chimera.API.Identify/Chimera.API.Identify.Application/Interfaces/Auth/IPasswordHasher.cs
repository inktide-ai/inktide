namespace Chimera.API.Identify.Application.Interfaces.Auth;

/// <summary>
/// Abstracts password hashing and verification to decouple the algorithm from the domain logic.
/// Implementations must be resistant to timing attacks and brute-force attacks (e.g. BCrypt, Argon2).
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Computes a cryptographic hash of <paramref name="password"/> suitable for persistent storage.
    /// </summary>
    string Hash(string password);

    /// <summary>
    /// Verifies that <paramref name="password"/> matches the previously computed <paramref name="hash"/>.
    /// Returns <see langword="false"/> for any invalid or tampered input without throwing.
    /// </summary>
    bool Verify(string password, string hash);
}
