namespace Chimera.API.Identify.Application.Interfaces.Auth;

/// <summary>Stores single-use password-reset tokens with a TTL. Each token maps to a userId.</summary>
public interface IPasswordResetStore
{
    /// <summary>Creates and persists a cryptographically-random token bound to <paramref name="userId"/> for <paramref name="lifetime"/>.</summary>
    Task<string> CreateAsync(string userId, TimeSpan lifetime, CancellationToken ct = default);

    /// <summary>
    /// Atomically consumes the token (read + delete). Returns the userId when valid;
    /// <see langword="null"/> when the token is missing, expired, or already used.
    /// </summary>
    Task<string?> ConsumeAsync(string token, CancellationToken ct = default);
}
