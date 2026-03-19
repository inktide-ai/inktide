namespace Chimera.API.Core.Settings;

/// <summary>
/// Keycloak OpenID Connect configuration.
/// Bound from the <c>KeycloakSettings</c> configuration section.
/// </summary>
public sealed class KeycloakSettings
{
    #region Fields

    private string _authority = string.Empty;
    private string _audience = string.Empty;
    private bool _requireHttpsMetadata = true;

    #endregion

    #region Properties

    /// <summary>
    /// Keycloak realm issuer URL, e.g. <c>http://localhost:8080/realms/chimera</c>.
    /// Used as both the JWT issuer and the OIDC discovery endpoint.
    /// </summary>
    public string Authority
    {
        get => _authority;
        set => _authority = value;
    }

    /// <summary>
    /// Expected <c>aud</c> claim in the access token (Keycloak client ID or <c>account</c>).
    /// </summary>
    public string Audience
    {
        get => _audience;
        set => _audience = value;
    }

    /// <summary>
    /// Set to <c>false</c> for local development without TLS.
    /// </summary>
    public bool RequireHttpsMetadata
    {
        get => _requireHttpsMetadata;
        set => _requireHttpsMetadata = value;
    }

    #endregion
}
