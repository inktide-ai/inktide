using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Connector.Application.OAuth;

/// <summary>
/// HMAC-SHA256 signing key for OAuth2 CSRF state tokens shared across connector OAuth flows.
/// Bound to the <c>AuthSettings</c> configuration section.
/// </summary>
public sealed class OAuthStateSettings
{
    /// <summary>Signing secret - minimum 32 characters. Set via <c>AuthSettings__SigningSecret</c> env var.</summary>
    [Required(AllowEmptyStrings = false)]
    [MinLength(32)]
    public string SigningSecret { get; init; } = string.Empty;
}
