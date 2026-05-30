using System.ComponentModel.DataAnnotations;
using Inktide.API.Developer.Domain.Enums;

namespace Inktide.API.Developer.REST.Models;

public sealed record UpdateApplicationRequest(
    [Required, StringLength(128, MinimumLength = 1)] string Name,
    string? Description,
    string? IconUrl,
    [Required] string[] RedirectUris,
    string? WebhookUrl,
    string? WebhookSecret,
    OAuthScope[] Scopes);
