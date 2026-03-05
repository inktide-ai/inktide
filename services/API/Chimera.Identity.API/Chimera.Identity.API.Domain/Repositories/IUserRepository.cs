using Chimera.Identity.Domain.Entities;

namespace Chimera.Identity.Domain.Repositories;

/// <summary>
/// User repository port (domain abstraction).
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByEmailAsync(
        string email,
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
}
