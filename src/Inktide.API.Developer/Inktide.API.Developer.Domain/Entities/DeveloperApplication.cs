using Inktide.API.Developer.Domain.Enums;

namespace Inktide.API.Developer.Domain.Entities;

public sealed class DeveloperApplication
{
    private DeveloperApplication() { }

    public Guid Id { get; private set; }
    public string OwnerUserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? IconUrl { get; private set; }
    public string KeycloakClientId { get; private set; } = string.Empty;
    public string ClientSecretHash { get; private set; } = string.Empty;
    public string[] RedirectUris { get; private set; } = [];
    public string? WebhookUrl { get; private set; }
    public string? WebhookSecretHash { get; private set; }
    public OAuthScope[] Scopes { get; private set; } = [];
    public ApplicationStatus Status { get; private set; } = ApplicationStatus.Active;
    public string? ConnectorSlug { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public ICollection<WebhookDelivery> Deliveries { get; private set; } = [];

    public static DeveloperApplication Create(
        string ownerUserId,
        string name,
        string? description,
        string? iconUrl,
        string keycloakClientId,
        string clientSecretHash,
        string[] redirectUris,
        string? webhookUrl,
        string? webhookSecretHash,
        OAuthScope[] scopes,
        string? connectorSlug = null) => new()
    {
        Id               = Guid.NewGuid(),
        OwnerUserId      = ownerUserId,
        Name             = name,
        Description      = description,
        IconUrl          = iconUrl,
        KeycloakClientId = keycloakClientId,
        ClientSecretHash = clientSecretHash,
        RedirectUris     = redirectUris,
        WebhookUrl       = webhookUrl,
        WebhookSecretHash= webhookSecretHash,
        Scopes           = scopes,
        Status           = ApplicationStatus.Active,
        ConnectorSlug    = connectorSlug,
        CreatedAt        = DateTime.UtcNow,
        UpdatedAt        = DateTime.UtcNow,
    };

    public void Update(
        string name,
        string? description,
        string? iconUrl,
        string[] redirectUris,
        string? webhookUrl,
        string? webhookSecretHash,
        OAuthScope[] scopes)
    {
        Name             = name;
        Description      = description;
        IconUrl          = iconUrl;
        RedirectUris     = redirectUris;
        WebhookUrl       = webhookUrl;
        if (webhookSecretHash is not null) WebhookSecretHash = webhookSecretHash;
        Scopes           = scopes;
        UpdatedAt        = DateTime.UtcNow;
    }

    public void RotateSecret(string newSecretHash)
    {
        ClientSecretHash = newSecretHash;
        UpdatedAt        = DateTime.UtcNow;
    }
}
