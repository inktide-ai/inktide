namespace Chimera.API.Profile.Application.Interfaces;

/// <summary>
/// Links an uploaded S3 object to the user's Keycloak <c>picture</c> attribute (public URL).
/// </summary>
public interface IUserAvatarService
{
    /// <summary>
    /// Validates <paramref name="objectKey"/> belongs to the user, builds a public URL, updates Keycloak user attribute <c>picture</c>.
    /// </summary>
    Task<UserAvatarUpdateResult> SetAvatarFromObjectKeyAsync(Guid userId, string objectKey, CancellationToken ct = default);
}

public sealed record UserAvatarUpdateResult(bool Success, string? PictureUrl, string? Error);
