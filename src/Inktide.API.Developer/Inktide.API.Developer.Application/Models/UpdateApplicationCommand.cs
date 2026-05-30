using Inktide.API.Developer.Domain.Enums;

namespace Inktide.API.Developer.Application.Models;

public sealed record UpdateApplicationCommand(
    string Name,
    string? Description,
    string? IconUrl,
    string[] RedirectUris,
    string? WebhookUrl,
    string? WebhookSecret,
    OAuthScope[] Scopes);
