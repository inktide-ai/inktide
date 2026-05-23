namespace Inktide.API.Profile.Application.Interfaces;

/// <summary>
/// Links an uploaded S3 object to the user's Keycloak <c>picture</c> attribute (public URL).
/// </summary>
public interface IUserAvatarService
{
    /// <summary>
    /// Validates <paramref name="objectKey"/> belongs to the user, builds a public URL, updates Keycloak + Postgres.
    /// </summary>
    Task<UserAvatarUpdateResult> SetAvatarFromObjectKeyAsync(Guid userId, string objectKey, CancellationToken ct = default);

    /// <summary>Returns the avatar URL stored in Postgres for this user, or null if not set.</summary>
    Task<string?> GetAvatarUrlAsync(string userId, CancellationToken ct = default);
}

public sealed record UserAvatarUpdateResult(bool Success, string? PictureUrl, string? Error);
