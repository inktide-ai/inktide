namespace Inktide.API.Developer.Infrastructure.Settings;

// Reads from the same KeycloakAdminSettings config section as Profile.
// Separate class to avoid cross-bounded-context project references.
public sealed class DeveloperKeycloakSettings
{
    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = "http://localhost:8080";
    public string Realm { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
