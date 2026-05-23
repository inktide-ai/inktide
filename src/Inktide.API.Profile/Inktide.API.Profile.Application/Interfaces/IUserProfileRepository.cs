namespace Inktide.API.Profile.Application.Interfaces;

/// <summary>
/// Persistence port for user profile data. Infrastructure owns the implementation;
/// Application only depends on this interface.
/// </summary>
public interface IUserProfileRepository
{
    Task<string?> GetAvatarUrlAsync(string userId, CancellationToken ct = default);
    Task UpsertAvatarUrlAsync(string userId, string avatarUrl, CancellationToken ct = default);
    Task DeleteAsync(string userId, CancellationToken ct = default);
}
