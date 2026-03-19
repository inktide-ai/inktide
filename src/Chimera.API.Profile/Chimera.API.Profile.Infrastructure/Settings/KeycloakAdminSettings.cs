namespace Chimera.API.Profile.Infrastructure.Settings;

/// <summary>
/// Optional Keycloak Admin REST client (client_credentials) to delete users after app data purge.
/// Create a confidential client in the realm with service account and <c>manage-users</c> (realm-management).
/// </summary>
public sealed class KeycloakAdminSettings
{
    #region Fields

    private bool _enabled;
    private string _baseUrl = "http://localhost:8080";
    private string _realm = string.Empty;
    private string _clientId = string.Empty;
    private string _clientSecret = string.Empty;

    #endregion

    #region Properties

    public bool Enabled
    {
        get => _enabled;
        set => _enabled = value;
    }

    /// <summary>Keycloak base URL without path, e.g. <c>http://localhost:8080</c>.</summary>
    public string BaseUrl
    {
        get => _baseUrl;
        set => _baseUrl = value;
    }

    /// <summary>Realm whose users are managed (same as JWT issuer realm).</summary>
    public string Realm
    {
        get => _realm;
        set => _realm = value;
    }

    public string ClientId
    {
        get => _clientId;
        set => _clientId = value;
    }

    public string ClientSecret
    {
        get => _clientSecret;
        set => _clientSecret = value;
    }

    #endregion
}
