using Chimera.API.Identify.Domain.Entities;

namespace Chimera.API.Identify.Domain.Repositories;

/// <summary>
/// User repository port (domain abstraction).
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByEmailAsync(
        string email,
        CancellationToken ct = default);

    Task<User?> GetByGoogleIdAsync(
        string googleId,
        CancellationToken ct = default);

    Task<User?> GetByTwitchIdAsync(
        string twitchId,
        CancellationToken ct = default);

    Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task<User> CreateAsync(
        string email,
        string passwordHash,
        string? displayName = null,
        CancellationToken ct = default);

    /// <summary>Updates the password hash for <paramref name="userId"/>. Returns false when user is not found.</summary>
    Task<bool> UpdatePasswordHashAsync(
        Guid userId,
        string newPasswordHash,
        CancellationToken ct = default);

    /// <summary>Links Google account to existing user. Returns false when user is not found.</summary>
    Task<bool> LinkGoogleAsync(
        Guid userId,
        string googleId,
        CancellationToken ct = default);

    /// <summary>Links Twitch account to existing user. Returns false when user is not found.</summary>
    Task<bool> LinkTwitchAsync(
        Guid userId,
        string twitchId,
        CancellationToken ct = default);

    /// <summary>Creates a user from OAuth. <paramref name="passwordHash"/> is a placeholder (OAuth users cannot login with password).</summary>
    Task<User> CreateFromOAuthAsync(
        string email,
        string? displayName,
        string passwordHash,
        string? googleId,
        string? twitchId,
        CancellationToken ct = default);
}
