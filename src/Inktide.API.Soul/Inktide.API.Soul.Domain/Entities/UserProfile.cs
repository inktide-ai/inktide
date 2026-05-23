namespace Inktide.API.Soul.Domain.Entities;

public sealed class UserProfile
{
    /// <summary>Keycloak user sub (UUID as string).</summary>
    public string UserId { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }
}
