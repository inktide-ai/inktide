using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Enums;

namespace Inktide.API.Developer.Application.Models;

public sealed record ApplicationDto(
    Guid Id,
    string Name,
    string? Description,
    string? IconUrl,
    string KeycloakClientId,
    string[] RedirectUris,
    string? WebhookUrl,
    OAuthScope[] Scopes,
    string Status,
    string? ConnectorSlug,
    DateTime CreatedAt)
{
    // Only populated on create / rotate-secret - never stored, never re-fetched
    public string? ClientSecret { get; init; }

    public static ApplicationDto From(DeveloperApplication app, string? plainSecret = null) => new(
        app.Id,
        app.Name,
        app.Description,
        app.IconUrl,
        app.KeycloakClientId,
        app.RedirectUris,
        app.WebhookUrl,
        app.Scopes,
        app.Status.ToString(),
        app.ConnectorSlug,
        app.CreatedAt)
    {
        ClientSecret = plainSecret,
    };
}
