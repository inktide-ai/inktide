namespace Chimera.Identity.API.Core.Settings;

/// <summary>
/// Bound to the <c>AuthSettings</c> configuration section.
/// Controls JWT issuance, token lifetimes and optional developer access.
/// </summary>
/// <remarks>
/// <b>Secret</b> must be at least 32 characters and must never be stored in source control.
/// Use <c>dotnet user-secrets</c> in development and environment variables / secret stores in production.
/// </remarks>
public sealed class AuthSettings
{
    private string _secret = string.Empty;
    private string _issuer = "Chimera.Identity.API";
    private string _audience = "Chimera.Clients";
    private string? _devApiKey;
    private int _accessTokenMinutes = 15;
    private int _refreshTokenDays = 7;
    private int _bcryptWorkFactor = 12;
    private bool _enableDemoLogin;

    /// <summary>HS256 signing key (minimum 32 characters). Required.</summary>
    public string Secret
    {
        get => _secret;
        set => _secret = value;
    }

    /// <summary>JWT <c>iss</c> claim.</summary>
    public string Issuer
    {
        get => _issuer;
        set => _issuer = value;
    }

    /// <summary>JWT <c>aud</c> claim.</summary>
    public string Audience
    {
        get => _audience;
        set => _audience = value;
    }

    /// <summary>
    /// Optional static API key accepted by the login endpoint (development / CI only).
    /// Leave empty or omit entirely in production.
    /// </summary>
    public string? DevApiKey
    {
        get => _devApiKey;
        set => _devApiKey = value;
    }

    /// <summary>Access token lifetime in minutes. Default: 15.</summary>
    public int AccessTokenMinutes
    {
        get => _accessTokenMinutes;
        set => _accessTokenMinutes = value;
    }

    /// <summary>Refresh token lifetime in days. Default: 7.</summary>
    public int RefreshTokenDays
    {
        get => _refreshTokenDays;
        set => _refreshTokenDays = value;
    }

    /// <summary>
    /// BCrypt work factor (cost parameter). Higher = slower hash, harder to brute-force.
    /// Default: 12. Increase over time as hardware gets faster.
    /// </summary>
    public int BcryptWorkFactor
    {
        get => _bcryptWorkFactor;
        set => _bcryptWorkFactor = value;
    }

    /// <summary>
    /// When <see langword="true"/>, allows login with username <c>demo</c> / password <c>demo</c>.
    /// Must be <see langword="false"/> in production.
    /// </summary>
    public bool EnableDemoLogin
    {
        get => _enableDemoLogin;
        set => _enableDemoLogin = value;
    }
}
