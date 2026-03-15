namespace Chimera.API.Identify.Application.Settings;

/// <summary>
/// OAuth provider configuration (Google, Twitch).
/// Bound to <c>OAuthSettings</c> section.
/// </summary>
public sealed class OAuthSettings
{
    /// <summary>Frontend URL for redirect after OAuth (e.g. https://app.chimera.ai). Used in callback.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>Path on frontend to receive tokens (e.g. /auth/callback). Tokens appended as hash fragment.</summary>
    public string FrontendCallbackPath { get; set; } = "/auth/callback";

    public GoogleOAuthSettings Google { get; set; } = new();
    public TwitchOAuthSettings Twitch { get; set; } = new();
    
    
}

public sealed class GoogleOAuthSettings
{
    public bool Enabled { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public sealed class TwitchOAuthSettings
{
    public bool Enabled { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
