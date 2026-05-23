namespace Inktide.API.Profile.Application.Entities;

/// <summary>
/// User profile record owned by the Profile bounded context.
/// Keycloak user sub (UUID as string) is the primary key.
/// </summary>
public sealed class UserProfile
{
    public string UserId { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
